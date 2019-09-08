<script>
  import { fade } from "svelte/transition";
  import Router, { push, pop, replace } from "svelte-spa-router";
  import { getClient, mutate } from "svelte-apollo";
  import { SEND_INVITATION } from "../queries.js";
  import { notifications } from "../Noto.svelte";

  const client = getClient();

  let email = "";
  let formIsDisabled = false;

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
</script>

<style>
  main {
    display: flex;
    justify-content: center;
    padding-top: 5rem;
  }
  .card-body {
    width: 18rem;
    height: 10rem;
  }
</style>

<main in:fade={{ duration: 500 }}>
  <div class="card">
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
          </div>
          <button type="submit" class="btn btn-primary">Send Invite</button>
        </fieldset>
      </form>
    </div>
  </div>
</main>
