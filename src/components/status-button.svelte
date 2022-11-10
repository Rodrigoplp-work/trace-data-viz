<script>
  import { createEventDispatcher } from 'svelte'

  export let text 
  export let type = ''
  export let tooltip = ''
  export let status

  const dispatch = createEventDispatcher()

  const toggle = () => {
    dispatch('toggle', { toggle: !status })
  }
</script>

<button on:click={toggle} title={tooltip}>
  <div class='dot' class:selected='{status}' />
  <span>{text}</span>
</button>

<style>
  button {
    background: none;
    /* color: #aaa; */
    color: #777;
    border: none;
    margin: 0;
    cursor: pointer;
    text-align: left;
    height: 35px;
    width: 100%;
    display: flex;
  }

  span {
    margin: auto auto auto 5px;
    width: 100%;
  }

  .dot {
    height: 10px;
    width: 10px;
    border-radius: 10px;
    margin: auto 2px;
    background: transparent;
    color: transparent;
  }

  .selected {
    background: #4040bf;
  }
</style>
