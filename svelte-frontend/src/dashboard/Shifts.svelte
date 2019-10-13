<script>
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import { fly } from "svelte/transition";
  import { quintOut } from "svelte/easing";
  import {
    isLoggedIn,
    refreshToken,
    user,
    connections,
    shifts,
    menuDisplayed
  } from "../store.js";
  import { getClient, query, mutate } from "svelte-apollo";
  import { GET_SHIFTS, PROPOSE_SHIFT } from "../queries.js";
  import { notifications } from "../Noto.svelte";
  import { formatDate } from "timeUtils";

  // let shifts = [];
  let myShifts = [];
  let selectedShift;
  let clickedShift;
  let showing = false;
  let requestingShiftConnection = false;
  let selectedCompany;
  let selectedCompanyId = "";
  let dateFormat = "#{l}, #{F} #{j}, #{Y} at #{H}:#{i}";
  let popoverX;
  let popoverY;
  let popoverWrapper;
  let content;
  let uls = [];

  const client = getClient();

  async function fetchShiftsFromInput() {
    if (!selectedCompany) {
      return;
    }

    selectedCompanyId = selectedCompany.company.id;

    fetchShifts();
  }

  async function fetchShifts() {
    const getShifts = query(client, {
      query: GET_SHIFTS,
      variables: { companyId: selectedCompanyId }
    });

    try {
      await getShifts.refetch().then(result => {
        shifts.set(result.data.shifts);
        myShifts = $shifts.filter(shift => shift.postedBy.id === $user.id);
        // console.log(myShifts);
        // console.log($shifts);
      });
    } catch (error) {
      console.log(error);
    }
  }

  async function proposeShift() {
    if (requestingShiftConnection === true) {
      notifications.info("A Shift Request is in progress!");
      return;
    }

    if (!selectedShift || !clickedShift) {
      notifications.danger("You must select a shift to propose");
      return;
    }

    requestingShiftConnection = true;

    try {
      await mutate(client, {
        mutation: PROPOSE_SHIFT,
        variables: {
          proposedShiftId: selectedShift.id,
          shiftId: clickedShift.id
        }
      }).then(result => {
        console.log(result.data.createShiftConnection.shiftConnection);
        notifications.success("Shift Request Sent");
        requestingShiftConnection = false;
      });
    } catch (error) {
      notifications.danger("Something went wrong! Please try again.");
      console.log(error);
      requestingShiftConnection = false;
    }
  }

  //   $: getShifts.refetch({ companyId: selectedCompanyId }).then(result => {
  //     shifts.set(result);
  //     //console.log($shifts);
  //   });

  //   $: if (Object.getOwnPropertyNames(selectedCompany) === 0) {
  //     console.log(selectedCompany.company.id);
  //   }

  function handleClickedShift(shift, ul) {
    if (requestingShiftConnection === true) {
      notifications.info("A Shift Request is in progress!");
      return;
    }

    if (showing === true && clickedShift.id === shift.id) {
      showing = false;
      clickedShift = null;
      popoverWrapper.style.display = "none";
      return;
    }

    showing = false;
    selectedShift = null;
    popoverWrapper.style.display = "inline-block";

    let contentRect = content.getBoundingClientRect();
    let ulRect = ul.getBoundingClientRect();
    let popoverContentRect = popoverWrapper.firstChild.getBoundingClientRect();

    popoverX = ulRect.width / 2 - popoverContentRect.width / 2;
    popoverY = ulRect.top - contentRect.height + window.scrollY;
    popoverWrapper.style.left = popoverX + "px";
    popoverWrapper.style.top = popoverY + "px";

    clickedShift = shift;

    setTimeout(() => {
      showing = true;
    }, 1);
  }

  onMount(() => {
    if ($user.isCompany) {
      selectedCompanyId = $user.id;
      fetchShifts();
    }
  });
</script>

<style>
  main {
    display: flex;
    justify-content: center;
    flex-direction: column;
  }
  #form {
    width: 200px;
    height: 2rem;
    padding-top: 65px;
    justify-content: center;
    margin: auto;
  }

  #form.menuDisplayed {
    padding-left: 200px;
    width: 400px;
  }

  @media screen and (max-width: 640px) {
    #form.menuDisplayed {
      padding-left: 0px;
      width: 200px;
    }
  }

  .content {
    width: 100%;
    margin-top: 45px;
  }
  #empty-container {
    margin-top: 55px;
    background-color: white;
    height: 55px;
    z-index: 999;
  }
  #empty-container.menuDisplayed {
    margin-left: 250px;
  }

  #inner-list-group {
    cursor: pointer;
  }

  #inner-list-group:hover {
    color: darkgrey;
  }

  .popover__title {
    font-size: 24px;
    line-height: 36px;
    text-decoration: none;
    color: rgb(228, 68, 68);
    text-align: center;
    padding: 15px 0;
  }

  #popover__wrapper {
    position: relative;
    display: inline-block;
  }
  .popover__content {
    opacity: 0;
    visibility: hidden;
    position: absolute;
    background-color: #f5f5f5;
    padding: 1.5rem;
    margin-top: -12px;
    box-shadow: 0 2px 5px 0 rgba(0, 0, 0, 0.26);
    transform: translate(0, 10px);
    width: 248px;
  }
  .popover__content:before {
    position: absolute;
    z-index: -1;
    content: "";
    right: calc(50% - 10px);
    top: -8px;
    border-style: solid;
    border-width: 0 10px 10px 10px;
    border-color: transparent transparent #f5f5f5 transparent;
    transition-duration: 0.3s;
    transition-property: transform;
  }
  #popover__wrapper.show .popover__content {
    z-index: 10;
    opacity: 1;
    visibility: visible;
    transform: translate(0, -20px);
    transition: all 0.5s cubic-bezier(0.75, -0.02, 0.2, 0.97);
  }

  #popover__wrapper.hide .popover__content {
    visibility: hidden;
  }

  p {
    text-align: center;
  }
</style>

<main in:fade={{ duration: 500 }}>
  {#if !$user.isCompany}
    {#if $connections.length > 0}
      <div
        id="empty-container"
        class="{$menuDisplayed ? 'menuDisplayed' : ''} fixed-top" />
      <div id="form" class="{$menuDisplayed ? 'menuDisplayed' : ''} fixed-top">
        <div class="input-group mb-3">
          <select
            on:change={fetchShiftsFromInput}
            bind:value={selectedCompany}
            id="company-selector"
            class="custom-select">
            <option value="" selected disabled hidden>Select Company</option>
            {#each $connections as choice}
              <option value={choice}>
                {choice.company.userprofile.companyName}
              </option>
            {/each}
          </select>
        </div>
      </div>
    {/if}
  {/if}
  {#if $connections.length < 1}
    {#if !$user.isCompany}
      <div>
        <h5>
          You are not a member of any company yet, please request an invite from
          your company's admin to start swapping shifts with your colleagues.
        </h5>
      </div>
    {:else}
      <div>
        <h5>
          You do not have any staff on your company yet, please send invites to
          your employees for them to start swapping shifts.
        </h5>
      </div>
    {/if}
  {/if}
  <div bind:this={content} class="content">
    {#if $shifts.length > 0}
      {#each $shifts as shift, i (shift.id)}
        <ul
          bind:this={uls[i]}
          on:click={() => {
            handleClickedShift(shift, uls[i]);
          }}
          id="inner-list-group"
          class="list-group list-group-action list-group-horizontal
          list-group-flush">
          <li class="list-group-item flex-fill">
            {formatDate(new Date(shift.fromTime), dateFormat)}
          </li>
          <li class="list-group-item flex-fill">
            {formatDate(new Date(shift.toTime), dateFormat)}
          </li>
          <li class="list-group-item flex-fill">
            {shift.postedBy.userprofile.firstName + ' ' + shift.postedBy.userprofile.lastName}
          </li>
        </ul>
      {/each}
    {/if}
    <div
      bind:this={popoverWrapper}
      id="popover__wrapper"
      class={showing ? 'show' : 'hide'}>
      <div class="popover__content">
        {#if clickedShift}
          {#if !$user.isCompany}
            {#if $user.id !== clickedShift.postedBy.id}
              {#if myShifts.length > 0}
                <div class="input-group mb-3">
                  <select
                    bind:value={selectedShift}
                    id="myShift-selector"
                    class="custom-select">
                    <option value="" selected disabled hidden>
                      Select shift to propose
                    </option>
                    {#each myShifts as choice}
                      <option value={choice}>
                        <p>
                          {'Starts ' + formatDate(new Date(choice.fromTime), dateFormat) + ' Ends ' + formatDate(new Date(choice.toTime), dateFormat)}
                        </p>
                      </option>
                    {/each}
                  </select>
                </div>
              {:else}
                <p>
                  You do not have any shift to propose, post shift to start
                  swapping.
                </p>
              {/if}
              {#if selectedShift}
                <p>
                  Starts {formatDate(new Date(selectedShift.fromTime), dateFormat)}
                </p>
                <p>
                  Ends {formatDate(new Date(selectedShift.toTime), dateFormat)}
                </p>
                <button on:click={proposeShift} class="btn btn-primary">
                  Propose Selected Shift
                </button>
              {/if}
            {:else}
              <p>This is your shift!!!</p>
            {/if}
          {:else}
            <p>This shift was posted to your company.</p>
          {/if}
        {/if}
      </div>
    </div>
  </div>
</main>
