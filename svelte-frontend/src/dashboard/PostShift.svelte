<script>
  import { fade } from "svelte/transition";
  import { getClient, mutate } from "svelte-apollo";
  import { notifications } from "../Noto.svelte";
  import { POST_SHIFT } from "../queries.js";
  import { myShifts, connections } from "../store.js";
  import { formatDate } from "timeUtils";
  import Datepicker from "svelte-calendar";

  const client = getClient();

  let fromTime;
  let toTime;
  let note = "";
  let isSponsored = false;
  let companyId;
  let selectedCompany;
  let dateFormat = "#{l}, #{F} #{j}, #{Y}";
  let fromDate = formatDate(new Date(), dateFormat);
  let toDate = formatDate(new Date(), dateFormat);
  let fromCalendarStartDate = new Date();
  let toCalendarStartDate = new Date();
  let toCalendarEndDate = new Date();
  let fromHour = 0;
  let toHour = 0;
  let fromMinute = 0;
  let toMinute = 0;
  let hourList = new Array(24);
  let minuteList = new Array(60);
  let fromClicked = false;
  let fromDateChosen = false;
  let toDateChosen = false;

  for (var i = 0; i < hourList.length; i++) {
    hourList[i] = i;
  }

  for (var i = 0; i < minuteList.length; i++) {
    minuteList[i] = i;
  }

  // toCalendarStartDate = formatDate(toCalendarStartDate, dateFormat);
  // fromCalendarStartDate = formatDate(fromCalendarStartDate, dateFormat);

  async function postShift() {
    try {
      await mutate(client, {
        mutation: POST_SHIFT,
        variables: {
          fromTime: fromTime,
          toTime: toTime,
          note: note,
          isSponsored: isSponsored,
          companyId: companyId
        }
      }).then(result => {
        $myShifts = [...$myShifts, result.data.createShift.shift];
        console.log($myShifts);
      });
    } catch (error) {
      console.log(error);
    }
  }

  async function handleSubmit() {
    if (!selectedCompany) {
      notifications.danger("You must select a company to proceed");
      return;
    }

    fromTime = new Date(fromDate + ", " + fromHour + ":" + fromMinute);
    toTime = new Date(toDate + ", " + toHour + ":" + toMinute);

    if (fromTime >= toTime) {
      notifications.danger("Shift end date must be higher than start date");
      return;
    }

    companyId = selectedCompany.company.id;
    isSponsored = false;

    postShift();

    // console.log("From: " + fromTime);
    // console.log("To: " + toTime);
    // console.log(note);
    // console.log(companyId);
  }

  $: toDate = fromDate;
  $: {
    toCalendarStartDate = new Date(fromDate);
    toCalendarEndDate.setDate(toCalendarStartDate.getDate() + 1);
    // toCalendarEndDate = toCalendarEndDate;
  }
</script>

<style>
  /* your styles go here */
  main {
    display: flex;
    justify-content: center;
  }
  .jumbotron {
    margin-top: 2rem;
  }
  .date-field {
    width: 250px;
    background-color: white;
  }
  .time-field {
    width: 60px;
    margin-bottom: 6px;
  }
  .postShift-btn {
    margin-top: 5px;
  }
</style>

<!-- markup (zero or more items) goes here -->
<div in:fade={{ duration: 500 }}>
  <main>
    {#if $connections.length > 0}
      <div class="jumbotron">
        <form class="" on:submit|preventDefault={handleSubmit}>
          <div class="">
            <h5>From :</h5>
            <Datepicker
              format={dateFormat}
              start={fromCalendarStartDate}
              bind:formattedSelected={fromDate}
              bind:dateChosen={fromDateChosen}
              on:open={() => {
                fromClicked = true;
              }}
              on:close={() => {
                fromClicked = false;
              }}>
              <input
                type="text"
                class="form-control date-field"
                value={fromDate}
                readonly
                placeholder="Pick a start date" />

            </Datepicker>
            <select
              bind:value={fromHour}
              aria-describedby="inputGroupSelect01"
              class="custom-select time-field">
              {#each hourList as choice}
                <option value={choice}>
                  {#if choice < 10}0{choice}{:else}{choice}{/if}
                </option>
              {/each}
            </select>
            <select
              bind:value={fromMinute}
              aria-describedby="inputGroupSelect01"
              class="custom-select time-field">
              {#each minuteList as choice}
                <option value={choice}>
                  {#if choice < 10}0{choice}{:else}{choice}{/if}
                </option>
              {/each}
            </select>
          </div>
          <div class="">
            <h5>To :</h5>
            <Datepicker
              format={dateFormat}
              start={toCalendarStartDate}
              bind:formattedSelected={toDate}
              bind:dateChosen={toDateChosen}>
              {#if !fromClicked}
                <input
                  type="text"
                  class="form-control date-field"
                  value={toDate}
                  readonly
                  placeholder="Pick a end date" />
              {/if}
            </Datepicker>
            <select
              bind:value={toHour}
              aria-describedby="inputGroupSelect01"
              class="custom-select time-field">
              {#each hourList as choice}
                <option value={choice}>
                  {#if choice < 10}0{choice}{:else}{choice}{/if}
                </option>
              {/each}
            </select>
            <select
              bind:value={toMinute}
              aria-describedby="inputGroupSelect01"
              class="custom-select time-field">
              {#each minuteList as choice}
                <option value={choice}>
                  {#if choice < 10}0{choice}{:else}{choice}{/if}
                </option>
              {/each}
            </select>
          </div>
          <div class="">
            <h5>Note :</h5>
            <textarea
              bind:value={note}
              class="form-control"
              name="note"
              id="note"
              cols=""
              rows=""
              placeholder="Enter a short note about this shift" />
          </div>
          <div class="mb-3">
            <h5>Company :</h5>
            <select bind:value={selectedCompany} class="custom-select">
              <option value="" selected disabled hidden>
                Select Company to post shift on
              </option>
              {#each $connections as choice}
                <option value={choice}>
                  {choice.company.userprofile.companyName}
                </option>
              {/each}
            </select>
          </div>
          <div class="">
            <button
              type="submit"
              class="btn btn-primary form-control postShift-btn">
              Post Shift
            </button>
          </div>
        </form>
      </div>
    {:else}
      <div>
        <h5>
          You are not a member of any company yet, please request an invite from
          your company's admin to start swapping shifts with your colleagues.
        </h5>
      </div>
    {/if}
  </main>
</div>
