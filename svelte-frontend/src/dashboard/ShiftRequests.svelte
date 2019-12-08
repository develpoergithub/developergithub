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
    selectedCompany,
    shifts,
    myShifts,
    shiftConnections,
    menuDisplayed
  } from "../store.js";
  import {
    fetchMyShifts,
    fetchShiftConnections,
    acceptShiftConnection
  } from "../authMethods.js";
  import { getClient, query, mutate } from "svelte-apollo";
  import { GET_SHIFTS, PROPOSE_SHIFT } from "../queries.js";
  import { notifications } from "../Noto.svelte";
  import { formatDate } from "timeUtils";
  import TableView from "../TableView.svelte";

  const client = getClient();

  let dateFormat = "#{D}, #{M} #{j}, #{Y} at #{h}:#{i}#{A}";
  let heads = ["Requesting Shift", "By", "Requesting For", "On"];
  let bodies = [];

  function handleClick(element, tr) {
    console.log(tr);
  }

  $: if ($shiftConnections.length > 0) {
    bodies = [];
    var requestingShifts = $shiftConnections.filter(
      x => x.proposedShift.postedBy.id !== $user.id
    );
    requestingShifts.forEach(element => {
      var pSFromTime = formatDate(
        new Date(element.proposedShift.fromTime),
        dateFormat
      );
      var pSToTime = formatDate(
        new Date(element.proposedShift.toTime),
        dateFormat
      );
      var sFromTime = formatDate(new Date(element.shift.fromTime), dateFormat);
      var sToTime = formatDate(new Date(element.shift.toTime), dateFormat);
      var pSPostedBy =
        element.proposedShift.postedBy.userprofile.firstName +
        " " +
        element.proposedShift.postedBy.userprofile.lastName;
      let shiftConnectionDisplay = {
        id: element.id,
        "Requesting Shift": pSFromTime + " to " + pSToTime,
        By: pSPostedBy,
        "Requesting For": sFromTime + " to " + sToTime,
        On: formatDate(new Date(element.created), dateFormat)
      };

      bodies = [...bodies, shiftConnectionDisplay];
    });
  }

  onMount(async () => {
    if (Object.entries($selectedCompany).length > 0) {
      await fetchShiftConnections(client, $selectedCompany.id);
      //   console.log($shiftConnections);
    }
  });
</script>

<style>
  /* your styles go here */
  h5 {
    text-align: center;
  }
</style>

<!-- markup (zero or more items) goes here -->
<main in:fade={{ duration: 500 }}>
  <div>
    {#if bodies.length > 0}
      <TableView {heads} {bodies} {handleClick} />
    {:else}
      <h5>You do not have any shift request!</h5>
    {/if}
  </div>
</main>
