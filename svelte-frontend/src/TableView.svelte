<script>
  // your script goes here

  export let heads;
  export let bodies;
  export let trs = [];
  export let handleClick;
</script>

<style>
  /* your styles go here */
  * {
    font-family: sans-serif; /* Change your font family */
  }

  .content-table {
    position: relative;
    border-collapse: collapse;
    margin: 0 auto;
    font-size: 0.9em;
    min-width: 600px;
    border-radius: 0px 0px 0 0;
    /* overflow: hidden; */
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.15);
  }

  .content-table thead tr {
    background-color: #009879;
    color: #ffffff;
    text-align: left;
    font-weight: bold;
  }

  .content-table th,
  .content-table td {
    padding: 12px 15px;
  }

  .content-table tbody tr {
    border-bottom: 1px solid #dddddd;
  }

  .content-table tbody tr:nth-of-type(even) {
    background-color: #f3f3f3;
  }

  .content-table tbody tr:last-of-type {
    border-bottom: 2px solid #009879;
  }

  /* .content-table tbody tr.active-row {
    font-weight: bold;
    color: #009879;
  } */

  .content-table th {
    background-color: #009879;
    position: sticky;
    position: -webkit-sticky;
    top: 55px;
  }
</style>

<!-- markup (zero or more items) goes here -->

<div>
  <table class="content-table">
    <thead>
      <tr>
        {#each heads as head}
          <th>{head}</th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each bodies as body, i}
        <tr
          bind:this={trs[i]}
          on:click={() => {
            handleClick(body, trs[i]);
          }}>
          {#each heads as key}
            <td>{body[key]}</td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>
