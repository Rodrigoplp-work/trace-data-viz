<script>
  import { createEventDispatcher } from 'svelte'
  import { scaleLinear } from 'd3-scale'
  import { axisTop } from 'd3-axis'
  import { max, min } from 'd3-array'
  import { select, selectAll } from 'd3-selection'
  import { zoom } from 'd3-zoom'
  import { interpolateRound } from 'd3-interpolate'
  import Tree from './tree.svelte'

  export let data
  export let treeData

  const dispatch = createEventDispatcher()
  const margin = { top: 22, right: 0, bottom: 0, left: 30 };
  const width = 1000
  const height = 330

  let svg, xAxis, xScale, selected, selectedState
  let minRange, maxRange, xTransform
  let totalStates = 0
  let kTransform = 1
  let xSpace = 0 // to apply zoom in x direction
  let ySpace = 0 // to apply zoom in y direction
  let yBuffer = 165 // to compensate no y-zoom when scrolling
  let rowHeight = 20
  let zooming = false
  
  $: if (data && data.rows.length > 0) {
    minRange = 0
    maxRange = 0
    data.rows.forEach(row => {
      let lastState
      if (row.states.length > 0) {
        if (minRange === 0) {
          minRange = max([0, row.states[0].start])
        } else {
          minRange = min([minRange, row.states[0].start])
        }
        lastState = row.states[row.states.length - 1]
        maxRange = max([maxRange, lastState.end])
      }
    })

    if (maxRange > 0) {
      xScale = scaleLinear()
        .domain([minRange, maxRange])
        .range([margin.left, width - margin.right])

      xTransform = `translate(0, ${margin.top})`

      // Clip
      /* select(svg).append("defs") */
      /*   .append("clipPath") */
      /*   .attr("id", "clip") */
      /*   .append("rect") */
      /*   .attr("width", width) */
      /*   .attr("height", height); */
      /* const g = select(svg).attr("clip-path", "url(#clip)") */

      select(xAxis).call(axisTop(xScale).tickSizeOuter(0).ticks(5))
      select(xAxis).selectAll(".tick text").style("font-size", "12px")
      select(svg).call(zoomer)
    }
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
    let dy = sourceEvent.movementY // drag vertically
    ySpace += dy
    let delta = sourceEvent.deltaY // wheel
    dispatch('zoom', { type, dx, delta, transform })
    zooming = false
  }

  const click = (e, index) => {
    selected = index
    selectedState = e
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
        return 'gray' //'#CCBF5D'
    }
  }
</script>

{#if data}
  <div class='time-graph'>
    <Tree data={treeData} {height} {rowHeight} marginTop={margin.top} />

    <div class='chart-box'>
      <svg bind:this={svg} {width} {height}>
        <g class='clip-rows'>
          {#each data.rows as row, i}
            <g class='clip-row'>
              <line x1={margin.left} x2={xSpace + xScale(maxRange * kTransform)} y1={margin.top + ySpace + i*rowHeight + rowHeight/2} y2={margin.top + ySpace + i*rowHeight + rowHeight/2} />
              {#each row.states as state, j}
                <g class='state' on:click={() => click(state, i + '-' + j)}>
                  <rect
                    x = {xSpace + xScale(state.start * kTransform)}
                    y = {margin.top + ySpace + i*rowHeight}
                    width = {(xScale(state.end) - xScale(state.start)) * kTransform}
                    height = {rowHeight}
                    fill = {color(state.data?.value)}
                    stroke = {selected === i + '-' + j ? 'black' : 'none'}
                  />
                  <!--
                  {#if (state.label && xScale(state.end) - xScale(state.start) > 100)}
                    <text x={xSpace + xScale(state.start * kTransform)} y={margin.top + ySpace + i*rowHeight + rowHeight/2}>
                      {state.label}
                    </text>
                  {/if}
                  -->
                </g>
              {/each}
            </g>
          {/each}
        </g>

        <g class='clip-x-axis' bind:this={xAxis} transform={xTransform} />
      </svg>
    </div>
  </div>
{/if}

{#if selected}
  <div class='text-info'>
    <p>{JSON.stringify(selectedState)}</p>
  </div>
{/if}

<style>
  .time-graph {
    display: flex;
  }

  .chart-box {
    position: relative;
    width: 1000px;
    height: 330px;
    margin: 0 0 10px 0;
    border: solid thin black;
    display: flex;
    flex-direction: column;
  }

  line {
    stroke: #eee;
    /* stroke: #eeeeee40; */
  }

  /* text { */
  /*   font-size: 9px; */
  /*   cursor: default; */
  /* } */
</style>
