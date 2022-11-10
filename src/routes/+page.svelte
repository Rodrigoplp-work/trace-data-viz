<script>
  import { onMount } from 'svelte'
  import * as api from '$lib/api'
  import TimeGraph from '../components/time-graph.svelte'
  import LineChart from '../components/line-chart.svelte'
  import StatusButton from '../components/status-button.svelte'
  import { splitRangeIntoEqualParts } from '../components/utils'
  
  export let data

  let files, file, fileName, experiments, outerZoom
  let xyData, resourcesData, threadData, xyTree, uri, buttonIndex
  let viewXYChart = false
  let viewResourcesChart = false
  let viewThreadChart = false
  let chartsWidth = 1000
  let openFiles = []
  let openExperiments = []

  // File management

  onMount(async () => {
    files = await api.get('/experiments')
  })

  const reset = () => {
    viewXYChart = false
    viewResourcesChart = false
    xyData = null
    xyTree = null
    openFiles = []
    openExperiments = []
  }
    
  const selectFile = async (name, i) => {
    reset()
    openFiles.push(i)
    openFiles = openFiles
    file = files[i]
    fileName = name
    let fileUUID = files[i].UUID
    experiments = await api.get('/experiments/' + fileUUID + '/outputs')
  }
    
  const selectExperiment = async (name, i) => {
    let index = openExperiments.indexOf(i)
    if (index > -1) {
      // openExperiments.splice(0, 1)
      let chartName = i === 0 ? 'xyChart' : 'resourcesChart'
      let e = { 
        detail: {
          chart: chartName,
          index: index
        } 
      }
      close(e)
    }
    else {
      openExperiments.push(i)
      openExperiments = openExperiments
      buttonIndex = i

      switch (experiments[i].type) {
        case 'TREE_TIME_XY':
          // Fetch data for xy chart
          await fetchCPUUsageData(experiments[i])
          viewXYChart = true
          break
        case 'TABLE':
          // Fetch data for table
          break
        case 'DATA_TREE':
          // Fetch data for data tree
          break
        case 'TIME_GRAPH':
          // Fetch data for time graph
          if (experiments[i].name === 'Resources Status') {
            resourcesData = await fetchStatus(experiments[i].id)
            viewResourcesChart = true
          }
          else if (experiments[i].name === 'Thread Status') {
            threadData = await fetchStatus(experiments[i].id)
            viewThreadChart = true
          }
          break
        default:
          console.log('Data for', name, 'not available')
      }
    }
  }

const zoomed = e => {
    outerZoom = e.detail.zoom
  }

  // CPU usage chart

  const fetchCPUUsageData = async () => {
    uri = file.UUID
    let descriptor = 'org.eclipse.tracecompass.analysis.os.linux.core.cpuusage.CpuUsageDataProvider'

    // Annotations
    let annotations = await api.get('/experiments/' + uri + '/outputs/' + descriptor + '/annotations')

    // xy
    let start = file.traces[0].start
    let end = file.traces[0].end
    let requested_timerange = splitRangeIntoEqualParts(Math.trunc(start), Math.trunc(end), chartsWidth)
    let params = { 
      parameters: { requested_items: [], requested_timerange }
    }
    xyData = await api.post('/experiments/' + uri + '/outputs/XY/' + descriptor + '/xy', params)

    // Tree
    /* params = { requested_timerange: [start, end] } */
    params = { parameters: { requested_timerange: { start, end }}}
    xyTree = await api.post('/experiments/' + uri + '/outputs/XY/' + descriptor + '/tree', params)
  }

  // Resources status chart

  const fetchStatus = async (descriptor) => {
    uri = file.UUID
    
    // Annotations
    let annotations = await api.get('/experiments/' + uri + '/outputs/' + descriptor + '/annotations')

    // Style
    let params = { parameters: {} }
    let style = await api.post('/experiments/' + uri + '/outputs/' + descriptor + '/style', params)

    // Tree
    let start = file.traces[0].start
    let end = file.traces[0].end
    let range = { start, end }
    /* params = { requested_timerange: [start, end]} */
    params = { parameters: { requested_timerange: { start, end }}}
    let resourcesTree = await api.post('/experiments/' + uri + '/outputs/timeGraph/' + descriptor + '/tree', params)
    let ar = resourcesTree.model.entries
    let items = []
    ar.forEach(entry => {
      items.push(entry.id)
    })

    // Arrows
    let requested_timerange = splitRangeIntoEqualParts(Math.trunc(start), Math.trunc(end), chartsWidth)
    params = {
      parameters: {
        requested_items: items,
        requested_timerange
      }
    }
    let arrows = await api.post('/experiments/' + uri + '/outputs/timeGraph/' + descriptor + '/arrows', params)

    // States
    params.parameters['requested_marker_categories'] = []
    let states = await api.post('/experiments/' + uri + '/outputs/timeGraph/' + descriptor + '/states', params)

    return { annotations, style, resourcesTree, arrows, states, range }
  }
</script>

<div class='workspace'>
  <div class='files'>
    <input type='file' multiple=true bind:files />

    {#if files}
      <ul class='file-list'>
        {#each files as file, i}
          <li>
            <StatusButton 
              on:toggle={selectFile(file.name, i)} 
              text={file.name}
              status={openFiles.includes(i)}
            />
          </li>
        {/each}
      </ul>
    {/if}

    {#if experiments}
      <ul>
        {#each experiments as experiment, i}
          <li>
            <StatusButton 
              on:toggle={selectExperiment(experiment.name, i)} 
              tooltip={experiment.description} 
              text={experiment.name} 
              type={experiment.type}
              status={openExperiments.includes(i)}
            />
          </li>
        {/each}
      </ul>
    {/if}
  </div>

  {#if fileName}
    <div class='space'>
      {#if viewXYChart && xyTree && xyData}
        <LineChart {xyData} {xyTree} {uri} on:close={close} on:zoom={zoomed} bind:outerZoom={outerZoom} />
      {/if}

      {#if viewResourcesChart && resourcesData}
        <TimeGraph {resourcesData} name='resourcesChart' index={buttonIndex} on:close={close} on:zoom={zoomed} bind:outerZoom={outerZoom} />
      {/if}

      {#if viewThreadChart && threadData}
        <TimeGraph resourcesData={threadData} name='threadChart' index={buttonIndex} on:close={close} on:zoom={zoomed} bind:outerZoom={outerZoom} />
      {/if}
    </div>
  {/if}
</div>

<style>
  .workspace {
    display: flex;
  }

  .files {
    width: 200px;
  }

  ul {
    padding: 0 0 1em 0;
  }

  .file-list {
    border-bottom: solid thin;
  }

  li {
    list-style-type: none;
    border: solid thin #777;
    border-bottom: none;
  }

  li:last-child {
    border-bottom: solid thin #777;
  }

  .space {
    margin: 1em;
    width: 100%;
    display: flex;
    flex-direction: column;
  }
</style>
