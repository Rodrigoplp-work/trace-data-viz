<script>
  import { scaleLinear } from 'd3-scale'
  import { axisTop } from 'd3-axis'
  import { select, selectAll } from 'd3-selection'

  export let data
  
  const margin = { top: 22, right: 0, bottom: 0, left: 0 };
  const width = 1000
  const height = 330

  let svg, xAxis, xScale, yScale, selected, selectedState
  let maxRange, xTransform, range
  let totalStates = 0
  let kTransform = 1
  let xSpace = 0 // to apply zoom in x direction
  let ySpace = 0 // to apply zoom in y direction
  let yBuffer = 165 // to compensate no y-zoom when scrolling
  let extent = 780
  let rowHeight = 20
  
  $: if (data) {
    maxRange = data.totalLength

    range = { start: data.rows[0].range.start, end: maxRange }

    xScale = scaleLinear()
      .domain([range.start, range.end])
      .range([margin.left, width - margin.right])

    yScale = scaleLinear()
      .domain([0, data.rows.length * rowHeight])
      .range([11, margin.top + data.rows.length * 10])

    xTransform = `translate(0, ${margin.top})`

    extent = data.rows.length * 10

    select(xAxis).call(axisTop(xScale).tickSizeOuter(0))
    select(xAxis).selectAll(".tick text").style("font-size", "12px")
    /* select(svg).call(zoomer) */
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
        return '#CCBF5D'
    }
  }
</script>

{#if data}
  <div class='chart-box'>
    <svg bind:this={svg} {width} {height}>
      <g class='rows'>
        {#each data.rows as row, i}
          <g class='row' transform='translate(0, {ySpace + yScale(rowHeight*i)})'>
            <line x1={0} x2={xSpace + xScale(maxRange * kTransform)} y1={ySpace + yScale(rowHeight*i) + 10} y2={ySpace + yScale(rowHeight*i) + 10} />
            {#each row.states as state, j}
              <g class='state' on:click={() => click(state, i + '-' + j)}>
                <rect
                  x = {xSpace + xScale(state.range.start * kTransform)}
                  y = {ySpace + yScale(rowHeight*i)}
                  width = {xScale((state.range.end - state.range.start)*kTransform)}
                  height = {yScale(rowHeight)}
                  fill = {color(state.data?.value)}
                  stroke = {selected === i + '-' + j ? 'black' : 'none'}
                />
                {#if (state.label && state.range.end - state.range.start > 1)}
                  <text x={xSpace + xScale(state.range.start * kTransform)} y={ySpace + yScale(rowHeight*i) + 12}>
                    {state.label}
                  </text>
                {/if}
              </g>
            {/each}
          </g>
        {/each}
      </g>

      <g class='x-axis' bind:this={xAxis} transform={xTransform} />
    </svg>
  </div>

  <p>{totalStates} elements</p>
{/if}

{#if selected}
  <div class='text-info'>
    <p>id: {selectedState.id}</p>
    <p>label: {selectedState.label}</p>
    <p>range: {JSON.stringify(selectedState.range)}</p>
    <p>data: {JSON.stringify(selectedState.data)}</p>
  </div>
{/if}

<style>
  .chart-box {
    position: relative;
    width: 1000px;
    height: 330px;
    background: #F9F6E8;
    margin: auto;
    border: solid thin black;
    display: flex;
    flex-direction: column;
  }

  line {
    stroke: lightgrey;
  }

  text {
    font-size: 9px;
    cursor: default;
  }
</style>
