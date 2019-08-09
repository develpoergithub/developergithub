<script>
  import { push, pop, replace } from "svelte-spa-router";
  import { fade } from "svelte/transition";
  import { getClient, query, mutate } from "svelte-apollo";
  import { isLoggedIn, refreshToken } from "../store.js";
  import { LOGIN_USER } from "../queries.js";

  const client = getClient();

  let email = "";
  let password = "";

  function handleSubmit() {
    login();
  }

  async function login() {
    try {
      await mutate(client, {
        mutation: LOGIN_USER,
        variables: { email, password }
      }).then(result => {
        refreshToken.set(result.data.tokenAuth.refreshToken);
        isLoggedIn.set(true);
        //push("/dashboard/");
      });
    } catch (error) {
      console.log(error);
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
    height: 25rem;
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
        <div class="form-group">
          <!-- <label for="exampleInputEmail1">Email address</label> -->
          <input
            bind:value={email}
            type="email"
            class="form-control"
            id="exampleInputEmail1"
            aria-describedby="emailHelp"
            placeholder="Enter email" />
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
            placeholder="Password" />
        </div>
        <div class="form-group form-check" />
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
      </form>
    </div>
  </div>
</main>
