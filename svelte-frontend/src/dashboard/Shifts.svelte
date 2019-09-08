<script>
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import {
    isLoggedIn,
    refreshToken,
    user,
    connections,
    shifts
  } from "../store.js";
  import { getClient, query, mutate } from "svelte-apollo";
  import { GET_SHIFTS } from "../queries.js";

  let selectedCompany;
  let selectedCompanyId = "";

  const client = getClient();

  async function fetchShifts() {
    if (!selectedCompany) {
      return;
    }

    selectedCompanyId = selectedCompany.company.id;

    const getShifts = query(client, {
      query: GET_SHIFTS,
      variables: { companyId: selectedCompanyId }
    });

    try {
      await getShifts.refetch().then(result => {
        shifts.set(result);
        console.log($shifts.data.shifts);
      });
    } catch (error) {
      console.log(error);
    }
  }

  //   $: getShifts.refetch({ companyId: selectedCompanyId }).then(result => {
  //     shifts.set(result);
  //     //console.log($shifts);
  //   });

  //   $: if (Object.getOwnPropertyNames(selectedCompany) === 0) {
  //     console.log(selectedCompany.company.id);
  //   }
</script>

<style>
  main {
    display: flex;
    justify-content: center;
  }
  .form {
    width: 20rem;
    height: 2rem;
    padding: 2rem;
  }
</style>

<main in:fade={{ duration: 500 }}>
  <div class="form ">
    <div class="input-group mb-3">
      <select
        on:change={fetchShifts}
        bind:value={selectedCompany}
        class="custom-select">
        <option value="">Select Company</option>
        {#each $connections as choice}
          <option value={choice}>
            {choice.company.userprofile.companyName}
          </option>
        {/each}
      </select>
    </div>
  </div>
  <div class="content">
    <div class="card" />
  </div>
</main>
