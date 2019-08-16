<script>
  import { fade } from "svelte/transition";
  import { push, pop, replace } from "svelte-spa-router";
  import { getClient, query, mutate } from "svelte-apollo";
  import { activateAccount } from "../authMethods.js";
  import { notifications } from "../Noto.svelte";

  const client = getClient();

  let email = "";
  let code = "";
  let formIsDisabled = false;

  async function handleSubmit() {
    formIsDisabled = true;

    setTimeout(() => {
      formIsDisabled = false;
    }, 2000);

    if (email.trim().length === 0 || code.trim().length === 0) {
      email = "";
      code = "";
      return notifications.danger("Email or code fields can not be empty");
    }

    try {
      await activateAccount(client, email, code);
    } catch (error) {
      // console.log(error);
      notifications.danger("Please make sure your code and email are correct");
    }
  }
</script>

<style>
  main {
    font-family: Verdana, Geneva, Tahoma, sans-serif;
    display: flex;
    justify-content: center;
    margin-top: 10rem;
  }
  .card {
    width: 22rem;
    height: 20rem;
  }
  h3 {
    text-align: center;
    font-size: 25px;
  }
  h6 {
    text-align: center;
    color: rgb(193, 193, 193);
  }
  /* label {
    margin-top: 10px;
    font-size: 20px;
  } */
  .btn {
    margin-top: 10px;
    width: 310px;
    height: 50px;
  }
  .form-group {
    margin-top: 15px;
  }
  .card-header {
    background-color: rgb(0, 45, 66);
    width: 22rem;
    margin-top: -20px;
    margin-left: -20px;
    color: white;
  }
</style>

<main>
  <div class="card" in:fade={{ duration: 500 }}>
    <div class="card-body">
      <div class="card-header rounded-top">
        <h3 class="card-title">Verify Account</h3>
        <h6 class="card-subtitle mb-2">
          Please enter your email and the code that was sent to your email
        </h6>
      </div>
      <form on:submit|preventDefault={handleSubmit}>
        <fieldset disabled={formIsDisabled}>
          <div class="form-group">
            <!-- <label for="exampleInputEmail1">Email address</label> -->
            <input
              bind:value={email}
              type="email"
              class="form-control"
              id="exampleInputEmail1"
              aria-describedby="emailHelp"
              placeholder="Enter email" />
            <input
              bind:value={code}
              type="text"
              class="form-control"
              id="exampleInputText1"
              aria-describedby="textHelp"
              placeholder="Enter code" />
          </div>

          <div class="form-group form-check" />
          <button type="submit" class="btn btn-primary">
            <h5>Confirm Account</h5>
          </button>
        </fieldset>
      </form>
    </div>
  </div>
</main>
