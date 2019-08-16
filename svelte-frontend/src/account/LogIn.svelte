<script>
  import { onMount, getContext } from "svelte";
  import { push, pop, replace } from "svelte-spa-router";
  import { fade } from "svelte/transition";
  import { getClient, query, mutate } from "svelte-apollo";
  import AuthRoute from "../AuthRoute.svelte";
  import { login, tokenRefreshTimeoutFunc } from "../authMethods.js";
  import { notifications } from "../Noto.svelte";
  // if ($isLoggedIn === true) {
  //   push("/dashboard/");
  // }

  const client = getClient();
  let email = "";
  let password = "";
  let isKeepMeLoggedIn = false;
  let formIsDisabled = false;

  async function handleSubmit() {
    formIsDisabled = true;

    setTimeout(() => {
      formIsDisabled = false;
    }, 2000);

    if (email.trim().length === 0 || password.trim().length === 0) {
      const msg = "Email or password fields can not be empty!";
      return notifications.danger(msg, 3000);
    }

    try {
      await login(client, email, password, isKeepMeLoggedIn);
    } catch (error) {
      // console.log(error);
      password = "";
      let msg = "Please make sure your email and password are correct!";
      notifications.danger(msg, 3000);
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
    height: 28rem;
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
  .ca {
    padding: 10px 0px;
    text-align: center;
  }
  .fp {
    margin: -10px 0px;
    text-align: center;
  }
</style>

<AuthRoute />
<main>
  <div class="card" in:fade={{ duration: 500 }}>
    <div class="card-body">
      <div class="card-header rounded-top">
        <h3 class="card-title">Log into SwapBoard</h3>
        <h6 class="card-subtitle mb-2">
          Please enter your email and password to login
        </h6>
      </div>
      <form on:submit|preventDefault={handleSubmit}>
        <fieldset disabled={formIsDisabled}>
          <div class="form-group {formIsDisabled}">
            <!-- <label for="exampleInputEmail1">Email address</label> -->
            <input
              bind:value={email}
              type="email"
              class="form-control"
              id="exampleInputEmail1"
              aria-describedby="emailHelp"
              placeholder="Enter email"
              required />
            <small id="emailHelp" class="form-text text-muted">
              We'll never share your email with anyone else.
            </small>
          </div>
          <div class="form-group">
            <!-- <label for="exampleInputPassword1">Password</label> -->
            <input
              bind:value={password}
              type="password"
              class="form-control password"
              id="exampleInputPassword1"
              placeholder="Password"
              required
              minlength="8"
              maxlength="30" />
          </div>
          <div class="form-group form-check">
            <input
              bind:checked={isKeepMeLoggedIn}
              type="checkbox"
              class="form-check-input"
              id="exampleCheck1" />
            <label class="form-check-label" for="exampleCheck1">
              keep me logged in
            </label>
          </div>
          <button type="submit" class="btn btn-primary">
            <h5>Login</h5>
          </button>
          <p class="form-text text-muted ca">
            Not registered?
            <a href="#/signup">Create an account</a>
          </p>
          <p class="form-text text-muted fp">
            <a href="#/recoveraccount">Forgort Password?</a>
          </p>
          <p class="form-text text-muted ca">
            <a href="#/verifyaccount">Verify your account?</a>
          </p>
        </fieldset>
      </form>
    </div>
  </div>
</main>
