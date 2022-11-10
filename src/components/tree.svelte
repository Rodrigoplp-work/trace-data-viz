<script>
  export let data 
  export let height
  export let rowHeight = 20
  export let marginTop = 22
</script>

<div class='tree'>
  <ul>
    {#each data as line}
      <li>{line.id} {line.parentId} {line.labels}</li>
    {/each}
</div>

<style>
  .tree {
    height: 308px;
    width: 200px;
    overflow: scroll;
    margin-top: 22px;
  }

  ul {
    margin: 0;
    padding: 0;
  }

  li {
    line-height: 20px;
    list-style: none;
    font-size: 13px;
  }
</style>
