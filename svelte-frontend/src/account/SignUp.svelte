<script>
  import { push, pop, replace } from "svelte-spa-router";
  import { getClient, query, mutate } from "svelte-apollo";
  import { CREATE_USER } from "../queries.js";
  import { fade } from "svelte/transition";
  import { isLoggedIn } from "../store.js";
  import { notifications } from "../Noto.svelte";
  import { register } from "../authMethods.js";
  import AuthRoute from "../AuthRoute.svelte";

  // if ($isLoggedIn === true) {
  //   push("/dashboard/");
  // }

  const client = getClient();

  let userTypeChoices = [
    { id: 0, text: `Signup as company or employee` },
    { id: 1, text: `Employee` },
    { id: 2, text: `Company` }
  ];

  let selectedUserType = userTypeChoices;
  let name = "";
  let placeHolderName = "";
  let email = "";
  let password = "";
  let confirmPassword = "";
  let isCompany = false;
  let formIsDisabled = false;

  $: if (selectedUserType.id === 1) {
    placeHolderName = "your name";
  } else if (selectedUserType.id === 2) {
    placeHolderName = "company name";
  } else {
    placeHolderName = "company or employee name";
  }

  async function handleSubmit() {
    formIsDisabled = true;

    setTimeout(() => {
      formIsDisabled = false;
    }, 2000);

    if (name.trim().length === 0) {
      name = "";
      return notifications.danger("You must enter a name");
    }

    if (email.trim().length === 0) {
      email = "";
      return notifications.danger("You must enter an email");
    }

    if (selectedUserType.id === 1) {
      isCompany = false;
    } else if (selectedUserType.id === 2) {
      isCompany = true;
    } else {
      return notifications.danger("You must signup as a company or employee!");
    }

    if (password !== confirmPassword) {
      password = "";
      confirmPassword = "";
      return notifications.danger("Your passwords do not match!");
    }

    try {
      await register(client, isCompany, name, email, password);
    } catch (error) {
      return notifications.danger("Email already exist");
    }
  }
</script>

<style>
  main {
    font-family: Verdana, Geneva, Tahoma, sans-serif;
    display: flex;
    justify-content: center;
    margin-top: 5rem;
  }
  .card {
    width: 25rem;
    height: 37rem;
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
    width: 22.5rem;
    height: 50px;
  }
  .form-group {
    margin-top: 15px;
  }
  .card-header {
    background-color: rgb(0, 45, 66);
    width: 25rem;
    margin-top: -20px;
    margin-left: -20px;
    color: white;
  }
  p {
    padding: 10px 0px;
    text-align: center;
  }
</style>

<AuthRoute />
<main>
  <div class="card .mx-auto" in:fade={{ duration: 500 }}>
    <div class="card-body">
      <div class="card-header">
        <h3 class="card-title">Create Account</h3>
        <h6 class="card-subtitle mb-2">
          Please fill in the form below to create an account on SwapBoard
        </h6>
      </div>
      <form class="form-group" on:submit|preventDefault={handleSubmit}>
        <fieldset disabled={formIsDisabled}>
          <div class="form-group">
            <select
              aria-describedby="inputGroupSelect01"
              bind:value={selectedUserType}
              class="custom-select">
              {#each userTypeChoices as choice}
                <option value={choice}>{choice.text}</option>
              {/each}
            </select>
            <small id="inputGroupSelect01" class="form-text text-muted note">
              Please note that you can not change this later.
            </small>
          </div>
          <div class="form-group">
            <!-- <label for="exampleInputPassword1">Password</label> -->
            <input
              bind:value={name}
              type="text"
              class="form-control text"
              id="exampleInputText1"
              placeholder={placeHolderName}
              required
              maxlength="60" />
          </div>
          <div class="form-group">
            <!-- <label for="exampleInputEmail1">Email address</label> -->
            <input
              bind:value={email}
              type="email"
              class="form-control"
              id="exampleInputEmail1"
              aria-describedby="emailHelp"
              placeholder="Enter a valid email address"
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
              id="password"
              placeholder="Password"
              required
              minlength="8"
              maxlength="30" />
          </div>
          <div class="form-group">
            <!-- <label for="exampleInputPassword1">Password</label> -->
            <input
              bind:value={confirmPassword}
              type="password"
              class="form-control password"
              id="confirmPassword"
              placeholder="Confirm Password"
              required
              minlength="8"
              maxlength="30" />
          </div>
          <div class="form-group form-check" />
          <button type="submit" class="btn btn-primary">
            <h5>SignUp</h5>
          </button>
          <p class="form-text text-muted">
            Already registered?
            <a href="#/login">Login</a>
            or
            <a href="#/verifyaccount">Verify your account</a>
          </p>
        </fieldset>
      </form>
    </div>
  </div>
</main>
