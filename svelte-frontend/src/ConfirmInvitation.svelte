<script>
  import { onMount } from "svelte";
  import { notifications } from "./Noto.svelte";
  import { isLoggedIn, user } from "./store.js";
  import { getClient, mutate } from "svelte-apollo";
  import { CONFIRM_INVITATION } from "./queries.js";
  import AuthRoute from "./AuthRoute.svelte";
  import { push } from "svelte-spa-router";

  export let params = {};

  const client = getClient();

  let label = "Confirming invitation, please wait...";

  function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function pushToLogin(ms, msg) {
    notifications.danger(msg, ms);
    await timeout(ms);
    push("/login");
  }

  async function confirmInvitation() {
    try {
      await mutate(client, {
        mutation: CONFIRM_INVITATION,
        variables: { invitationId: params.id }
      }).then(result => {
        label = "Congratulation, invitation confirmed!";
        let msg =
          "You have successfully joined " +
          result.data.confirmUserConnection.userConnection.company.userprofile
            .companyName;
        if (result.data.confirmUserConnection.userConnection.isConfirmed) {
          notifications.success(msg);
        }
        setTimeout(() => {
          push("/dashboard/");
        }, 3500);
      });
    } catch (error) {
      console.log(error);
      label = "An error occurred";
      notifications.danger(label, 1500);
      setTimeout(() => {
        push("/dashboard/");
      }, 1800);
    }
  }
  // console.log(params.id);

  onMount(async () => {
    await timeout(3000);

    if ($isLoggedIn === false) {
      var msg = "You are not Logged in, redirecting to the log in page...";
      await pushToLogin(2000, msg);
    } else {
      confirmInvitation();
    }
  });
</script>

<style>
  /* your styles go here */
</style>

<!-- <AuthRoute /> -->
<main>
  <div class="card">
    <p>{label}</p>
  </div>
</main>
