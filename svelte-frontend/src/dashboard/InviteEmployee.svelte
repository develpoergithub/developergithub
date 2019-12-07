<script>
  import { fade } from "svelte/transition";
  import Router, { push, pop, replace } from "svelte-spa-router";
  import { getClient, mutate } from "svelte-apollo";
  import { SEND_INVITATION } from "../queries.js";
  import { connections } from "../store.js";
  import { notifications } from "../Noto.svelte";
  import TableView from "../TableView.svelte";

  const client = getClient();

  let email = "";
  let formIsDisabled = false;
  let heads = ["Email", "First Name", "Last Name", "Status"];
  let bodies = [];

  function handleSubmit() {
    if (!email) {
      return;
    }

    sendInvitation();
  }

  async function sendInvitation() {
    formIsDisabled = true;
    try {
      await mutate(client, {
        mutation: SEND_INVITATION,
        variables: { employeeEmail: email }
      }).then(result => {
        console.log(result.data.createUserConnection.userConnection);
        notifications.success("Invite Sent!");
        email = "";
        formIsDisabled = false;
      });
    } catch (error) {
      console.log(error);
      notifications.danger("Something went wrong, please try again!");
      formIsDisabled = false;
    }
  }

  function handleClickedConnection(connection, tr) {
    console.log(tr);
  }

  $: if ($connections.length > 0) {
    $connections.forEach(element => {
      let userConnectionDisplay = {
        id: element.id,
        Email: element.employee.email,
        "First Name": element.employee.userprofile.firstName,
        "Last Name": element.employee.userprofile.lastName,
        Status: getUserConnectionStatus(element)
      };

      bodies = [...bodies, userConnectionDisplay];
    });
  }

  function getUserConnectionStatus(element) {
    if (element.isDeclined) {
      return "Declined";
    }

    if (element.isConfirmed) {
      return "Joined";
    } else {
      return "Pending";
    }
  }
</script>

<style>
  main {
    /* display: flex; */
    position: relative;
    justify-content: center;
    /* padding-top: 1rem; */
  }
  .card-body {
    width: 28rem;
    height: 6rem;
  }
</style>

<main in:fade={{ duration: 500 }}>
  <div class="card-body">
    <form on:submit|preventDefault={handleSubmit}>
      <fieldset disabled={formIsDisabled}>
        <div class="form-group">
          <input
            bind:value={email}
            type="email"
            id="email"
            class="form-control"
            required
            placeholder="Enter employee email" />
          <button type="submit" class="btn btn-primary">Send Invite</button>
        </div>
      </fieldset>
    </form>
  </div>
  <TableView {heads} {bodies} handleClick={handleClickedConnection} />
</main>
