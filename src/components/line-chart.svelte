<script>
  import * as api from '$lib/api'
  import { createEventDispatcher } from 'svelte'
  import { line } from "d3-shape"
  import { scaleBand, scaleLinear } from 'd3-scale'
  import { axisTop, axisLeft } from 'd3-axis'
  import { max, min, range } from 'd3-array'
  import { select, selectAll } from 'd3-selection'
  import { brushX, brushSelection } from 'd3'
  import { interpolateRound } from 'd3-interpolate'
  import { zoom } from 'd3-zoom'
  import LineClip from './line-clip.svelte'
  import { splitRangeIntoEqualParts } from '../components/utils'

  export let xyData
  export let xyTree
  export let uri
  export let outerZoom

  const dispatch = createEventDispatcher()
  const margin = { top: 22, right: 0, bottom: 0, left: 30 };
  const width = 1000
  const height = 100

  let svg, xAxis, yAxis, xScale, yScale, selected, selectedState, domData, xTranslate
  let maxRange, xTransform, yTransform, box, boxer, gb, dataClone, lineData
  let startRange, endRange, zooming, lineChart, xDomain, domain
  let fineScale = false // to switch brush off when zoom is too deep
  let data = []
  let localZoom = true

  $: if (xyData  && xyData.model.series.length > 0 && xyTree) {
    data = []
    xyData.model.series[0].xValues.forEach((x, i) => {
      data.push({ xValue: x, yValue: xyData.model.series[0].yValues[i] })
    })

    xDomain = [0, xyData.model.series[0].xValues.length - 1]

    xScale = scaleLinear()
      .domain([+xyData.model.series[0].xValues[xDomain[0]], +xyData.model.series[0].xValues[xDomain[1]]])
      .range([margin.left, width - margin.right])

    yScale = scaleLinear()
      .domain([0, max(xyData.model.series[0].yValues)])
      .range([height - margin.bottom, margin.top])

    xTransform = `translate(0, ${margin.top})`
    yTransform = `translate(${margin.left}, 0)`

    xTranslate = (g, x) => g.call(axisTop(x).ticks(5))

    lineData = line()
      .x(d => xScale(+d.xValue))
      .y(d => yScale(+d.yValue))

    // Brush
    boxer = brushX()
      .extent([[margin.left, 0.5], [width - margin.right, height - margin.bottom + 0.5]])
      .on("end", brushended)

    gb = select(box)
      .call(boxer)
      .call(boxer.move, [margin.left, 200]);

    // Clip
    /* select(svg).append("defs") */
    /*   .append("clipPath") */
    /*   .attr("id", "clip") */
    /*   .append("rect") */
    /*   .attr("width", width) */
    /*   .attr("height", height); */
    /* const g = select(svg).attr("clip-path", "url(#clip)") */

    // Axis
    select(xAxis).call(axisTop(xScale).tickSizeOuter(0).ticks(5))
    select(xAxis).selectAll(".tick text").style("font-size", "12px")

    select(yAxis).call(axisLeft(yScale).tickSizeOuter(0).ticks(3))
    select(yAxis).selectAll(".tick text").style("font-size", "12px").text(d => scaleYLabel(d))

    // Zoom
    /* select(svg).call(zoomer) */
  }

  $: if (outerZoom) {
    localZoom = false
    zoomed(outerZoom)
  }

  const scaleYLabel = (d) => {
    return d >= 1000000000000 ? d / 1000000000000 + 'G' :
      d >= 1000000000 ? d / 1000000000  + 'B':
      d >= 1000000 ? d / 1000000 + 'M' :
      d >= 1000 ? d / 1000 + 'K':
      d
  }

  const zoomer = zoom()
  .on('zoom', ({ transform, sourceEvent }) => {
    if (!zooming) {
      zooming = true
      requestAnimationFrame(() => update(transform, sourceEvent))
    }
  })

  const update = (transform, sourceEvent) => {
    let type = sourceEvent.type
    let dx = sourceEvent.movementX // drag horizontally
    let dy = sourceEvent.movementY // grad vertically
    let delta = sourceEvent.deltaY // wheel
    console.log(delta)
    
    // Zoom top axis
    const zx = transform.rescaleX(xScale).interpolate(interpolateRound)
    select(xAxis).call(xTranslate, zx)

    xDomain1 += delta
    xDomain2 += delta
    xScale.domain([+xyData.model.series[0].xValues[xDomain1], +xyData.model.series[0].xValues[xDomain2]])

    /* xScale = scaleLinear() */
    /*   .domain([+xyData.model.series[0].xValues[0] + 10*delta, +xyData.model.series[0].xValues[xLength - 1] + 10*delta]) */
    /*   .range([margin.left, width - margin.right]) */

    lineData = line()
      .x(d => xScale(+d.xValue))
      .y(d => yScale(+d.yValue))

    /* select(lineChart).call(g => g.attr('transform', `translate(${zx}, 0)`)) */

    /* linePath.attr("transform",d3.event.transform) */
		/* select(xAxis).scale(transform.rescaleX(xScale)) */
		/* select(yAxis).call(yAxis.scale(d3.event.transform.rescaleY(yScale))) */

    zooming = false
  }

  const brushended = async ({selection}) => {
    if (!selection) {
      gb.call(boxer.move, [[0, 0], [0, 0]]);
    } else {
      let left = Math.trunc((selection[0]/width) * xyData.model.series[0].xValues.length)
      let right = Math.trunc((selection[1]/width) * xyData.model.series[0].xValues.length)
      startRange = xyData.model.series[0].xValues[left]
      endRange = xyData.model.series[0].xValues[right]
      cropData(left, right)
    }
  }

  const cropData = async () => {
    let requested_timerange = splitRangeIntoEqualParts(startRange, endRange, width)
    let params = {
      parameters: { requested_items: [], requested_timerange }
    }
    domData = await api.post('/experiments/' + uri + '/outputs/XY/org.eclipse.tracecompass.analysis.os.linux.core.cpuusage.CpuUsageDataProvider/xy', params)
  }

  const zoomed = e => {
    /* if (localZoom) { */
    /*   dispatch('zoom', { zoom: e }) */
    /* } */
    localZoom = true
    let current = brushSelection(box)
    let type = e.detail.type
    let dx = e.detail.dx
    let delta = - e.detail.delta
    let newSelection

    if (type === 'mousemove') {
      if (current[1] - current[0] < 20) {
        // In case of zooming too much, don't use the brush because it works
        // with the resolution of the screen, not the resolution of the data
        let factor = (endRange - startRange) * 0.01
        startRange -= dx * factor
        endRange -= dx * factor
        cropData()
      }
      else {
        newSelection = [max([current[0] - dx, 0]), min([current[1] - dx, width])]
        gb.call(boxer.move, newSelection)
      }
    }
    else if (type === 'wheel') {
      if (current[1] - current[0] < 20 && !fineScale) {
        // In case of zooming too much, stop using the brush because it works
        // with the resolution of the screen, not the resolution of the data
        let factor = (endRange - startRange) * 0.01
        startRange += delta * factor
        endRange -= delta * factor
        cropData()

        // If zooming back out, go back to use the brush to pan and zoom
        fineScale = startRange < xyData.model.series[0].xValues[Math.trunc(current[0])]
      }
      else {
        fineScale = false
        let x0 = max([current[0] + delta, 0])
        let x1 = max([current[1] - delta, 0])
        newSelection = [x0, x1]
        gb.call(boxer.move, newSelection)
      }
    }
  }
</script>

{#if data.length > 0}
  <div class='line-chart'>
    <div class='chart'>
      <button on:click={() => dispatch('close', { chart: 'xyChart' })}>x</button>

      <div class='chart-box'>
        <svg bind:this={svg} {width} {height}>
          <g class='data'>
            <path
              bind:this = { lineChart }
              class = 'line'
              d = { lineData(data) }
              fill = 'none'
              stroke = '#aaa'
              stroke-width = 1
            />
          </g>

          <g class='x-axis' bind:this={xAxis} transform={xTransform} />
          <g class='y-axis' bind:this={yAxis} transform={yTransform} />

          <g class='box' bind:this={box} />
        </svg>
      </div>
    </div>

    {#if domData}
      <LineClip xyData={domData} {xyTree} {domain} on:zoom-line-chart={zoomed} />
    {/if}
  </div>
{/if}

<style>
  button {
    height: 30px;
    width: 30px;
    background: transparent;
    color: #777;
    border: solid thin #777;
    cursor: pointer;
  }

  .chart {
    display: flex;
  }

  .chart-box {
    position: relative;
    width: 1000px;
    height: 100px;
    margin: 0 0 10px 170px;
    border: solid thin black;
    display: flex;
    flex-direction: column;
  }
</style>
