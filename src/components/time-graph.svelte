<script>
  import { createEventDispatcher } from 'svelte'
  import TimeGraphClip from './time-graph-clip.svelte'
  import { scaleLinear } from 'd3-scale'
  import { axisTop } from 'd3-axis'
  import { max, min } from 'd3-array'
  import { select, selectAll } from 'd3-selection'
  import { brushX, brushSelection } from 'd3'
  import { interpolateRound } from 'd3-interpolate'

  export let resourcesData
  export let outerZoom
  export let name
  export let index
  
  const dispatch = createEventDispatcher()
  const margin = { top: 22, right: 0, bottom: 0, left: 30 };
  const width = 1000
  const height = 150

  // TODO: retrieve these variables from resourcesData:
  let annotations, style, resourcesTree, arrows, states

  let svg, data, xAxis, xScale, yScale, selected, selectedState, domData, xTranslate
  let xTransform, box, boxer, gb, dataClone
  let startRow, endRow, startRange, endRange
  let totalStates = 0
  let kTransform = 1
  let xSpace = 0 // to apply zoom in x direction
  let ySpace = 0 // to apply zoom in y direction
  let yBuffer = 165 // to compensate no y-zoom when scrolling
  let rowHeight // = 20
  let xDomain = [0, 0]
  let fineScale = false // to switch brush off when zoom is too deep
  let localZoom = true
  
  $: if (resourcesData) {
    data = resourcesData.states.model
    dataClone = JSON.parse(JSON.stringify(data))
    rowHeight = (height - margin.top) / data.rows.length

    xScale = scaleLinear()
      .domain([resourcesData.range.start, resourcesData.range.end])
      .range([margin.left, width - margin.right])

    yScale = scaleLinear()
      .domain([0, data.rows.length * rowHeight])
      .range([margin.top / 2, height - margin.bottom])

    xTransform = `translate(0, ${margin.top})`

    xTranslate = (g, x) => g
      .attr("transform", `translate(0, ${margin.top})`)
      .call(axisTop(x).ticks(12))

    // Brush
    boxer = brushX()
      .extent([[margin.left, 0.5], [width - margin.right, height - margin.bottom + 0.5]])
      .on("end", brushended)

    gb = select(box)
      .call(boxer)
      .call(boxer.move, [margin.left, 200]);

    select(xAxis).call(axisTop(xScale).tickSizeOuter(0).ticks(5))
    select(xAxis).selectAll(".tick text").style("font-size", "12px")
    /* select(svg).call(zoomer) */
  }

  $: if (outerZoom) {
    localZoom = false
    zoomed(outerZoom)
  }

  const color = e => {
    switch (e) {
      case 2:
        return '#BC2F00'

      case 4:
        return '#11AD1C'

      case 4072:
        return '#CCBF5D'

      default:
        return 'gray' // '#CCBF5D'
    }
  }

  const brushended = ({selection}) => {
    if (!selection) {
      gb.call(boxer.move, [[0, 0], [0, 0]]);
    }
    else if (selection[0] === 0 && selection[1] === 0) {
      console.log('line')
    }
    else {
      /* startRow = max([Math.floor((selection[0][1] - margin.top) / (2 * rowHeight)), 0]) */
      /* endRow = max([Math.floor((selection[1][1] - margin.top) / (2 * rowHeight)), 0]) */

      /* let swath = resourcesData.range.end - resourcesData.range.start */
      /* startRange = Math.floor(resourcesData.range.start + selection[0][0] * swath / width) */
      /* endRange = Math.ceil(resourcesData.range.start + selection[1][0] * swath / width) */

      let swath = resourcesData.range.end - resourcesData.range.start
      startRange = Math.floor(resourcesData.range.start + selection[0] * swath / width)
      endRange = Math.ceil(resourcesData.range.start + selection[1] * swath / width)

      domData = cropData()
    }
  }

  const cropData = () => {
    dataClone = JSON.parse(JSON.stringify(data))
    /* dataClone.rows = dataClone.rows.slice(startRow, endRow) */

    xDomain = [startRange, endRange]

    totalStates = 0
    dataClone.rows.forEach(row => {
      let ranges = []
      row.states.forEach((state, j) => {
        if (state.style && state.end > startRange && state.start < endRange) {
          state.start = max([state.start, startRange])
          state.end = min([state.end, endRange])
          ranges.push(state)
        }
      })
      row.states = ranges
      totalStates += ranges.length
    })
    return dataClone
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
        startRange += delta * factor
        endRange -= delta * factor
        domData = cropData()
      }
      else {
        /* newSelection = [[current[0][0] - dx, current[0][1] - dy], [current[1][0] - dx, current[1][1] - dy]] */ 
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
        domData = cropData()

        // If zooming back out, go back to use the brush to pan and zoom
        fineScale = startRange * width / resourcesData.range.end < current[0][0]
      }
      else {
        fineScale = false
        let x0 = max([current[0] + delta, 0])
        /* let y0 = current[0][1] */
        let x1 = max([current[1] - delta, 0])
        /* let y1 = current[1][1] */
        /* newSelection = [[x0, y0], [x1, y1]] */
        newSelection = [x0, x1]
        gb.call(boxer.move, newSelection)
      }
    }
  }
</script>

{#if data}
  <div class='time-graph'>
    <div class='chart'>
      <button on:click={() => dispatch('close', { chart: name, index: index })}>x</button>

      <div class='chart-box'>
        <svg bind:this={svg} {width} {height}>
          <g class='rows'>
            {#each data.rows as row, i}
              <g class='row'>
                <!--
                <g class='row' transform='translate(0, {ySpace + (margin.top/2) + yScale(rowHeight*i)})'>
                <line x1={margin.left} x2={xSpace + xScale(resourcesData.range.end * kTransform)} y1={ySpace + yScale(rowHeight*i + rowHeight/2)} y2={ySpace + yScale(rowHeight*i + rowHeight/2)} />
                -->
                {#each row.states as state, j}
                  {#if state.style}
                    <g class='state'>
                      <rect
                        x = {xSpace + xScale(state.start * kTransform)}
                        y = {margin.top + rowHeight * i}
                        width = {(xScale(state.end) - xScale(state.start))*kTransform}
                        height = {rowHeight}
                        fill = {color(state.data?.value)}
                        stroke = {selected === i + '-' + j ? 'black' : 'none'}
                      />
                    </g>
                  {/if}
                {/each}
              </g>
            {/each}
          </g>

          <g class='x-axis' bind:this={xAxis} transform={xTransform} />

          <g class='box' bind:this={box} />
        </svg>
      </div>
    </div>

    <!-- <p>{totalStates} brushed elements</p> -->

    <TimeGraphClip data={domData} treeData={resourcesData.resourcesTree.model.entries} {xDomain} on:zoom={zoomed} />
  </div>
{/if}

<style>
  .chart { 
    display: flex;
  }

  button {
    height: 30px;
    width: 30px;
    background: transparent;
    color: #777;
    border: solid thin #777;
    cursor: pointer;
  }

  .chart-box {
    position: relative;
    width: 1000px;
    height: 150px;
    margin: 0 0 10px 170px;
    border: solid thin black;
    display: flex;
    flex-direction: column;
  }

  line {
    stroke: lightgrey;
  }
</style>
