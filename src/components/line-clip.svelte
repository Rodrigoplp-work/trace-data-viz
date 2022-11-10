<script>
  import { createEventDispatcher } from 'svelte'
  import { line } from "d3-shape"
  import { scaleBand, scaleLinear } from 'd3-scale'
  import { axisTop, axisLeft } from 'd3-axis'
  import { max, min, range } from 'd3-array'
  import { select, selectAll } from 'd3-selection'
  import { interpolateRound } from 'd3-interpolate'
  import { zoom } from 'd3-zoom'

  export let xyData
  export let xyTree
  
  const dispatch = createEventDispatcher()
  const margin = { top: 22, right: 0, bottom: 0, left: 30 };
  const width = 1000
  const height = 330

  let svg, xAxisLineClip, yAxis, xScale, yScale, selected, selectedState, domData, xTranslate
  let maxRange, xTransform, yTransform, box, boxer, gb, dataClone, lineData
  let startRange, endRange, zooming, lineChart
  let data = []

  $: if (xyData && xyData.model.series.length > 0 && xyTree) {
    data = []
    xyData.model.series[0].xValues.forEach((x, i) => {
      data.push({ xValue: x, yValue: xyData.model.series[0].yValues[i] })
    })

    xScale = scaleLinear()
      .domain([+xyData.model.series[0].xValues[0], +xyData.model.series[0].xValues[999]])
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

    // Clip
    select(svg).append("defs")
      .append("clipPath")
      .attr("id", "clip")
      .append("rect")
      .attr("width", width)
      .attr("height", height);
    const g = select(svg).attr("clip-path", "url(#clip)")

    // Axis
    select(xAxisLineClip).call(axisTop(xScale).tickSizeOuter(0).ticks(5))
    select(xAxisLineClip).selectAll(".tick text").style("font-size", "12px")

    select(yAxis).call(axisLeft(yScale).tickSizeOuter(0))
    select(yAxis).selectAll(".tick text").style("font-size", "12px").text(d => scaleYLabel(d))

    // Zoom
    select(svg).call(zoomer)
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
    let delta = sourceEvent.deltaY // wheel
    dispatch('zoom-line-chart', { type, dx, delta, transform })
    zooming = false
  }
</script>

{#if data}
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

      <g class='x-axis' bind:this={xAxisLineClip} transform={xTransform} />
      <g class='y-axis' bind:this={yAxis} transform={yTransform} />

      <g class='box' bind:this={box} />
    </svg>
  </div>
{/if}

<style>
  .chart-box {
    position: relative;
    width: 1000px;
    height: 330px;
    margin: 0 0 10px 200px;
    border: solid thin black;
    display: flex;
    flex-direction: column;
  }
</style>
