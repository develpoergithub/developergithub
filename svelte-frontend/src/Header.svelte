<script>
  import { push } from "svelte-spa-router";
  import { keepMeLoggedIn, isLoggedIn, refreshToken, user } from "./store.js";
  import { logout } from "./authMethods.js";

  function handleLogout() {
    logout();
  }
</script>

<style>
  .navbar {
    max-height: 55px !important;
  }
</style>

<main>
  <nav class="navbar sticky-top navbar-expand-sm navbar-light bg-light">
    <a class="navbar-brand" href="#/">SWAPBOARD</a>
    <button
      class="navbar-toggler"
      type="button"
      data-toggle="collapse"
      data-target="#navbarSupportedContent"
      aria-controls="navbarSupportedContent"
      aria-expanded="false"
      aria-label="Toggle navigation">
      <span class="navbar-toggler-icon" />
    </button>
    {#if $isLoggedIn}
      <div class="collapse navbar-collapse" id="navbarSupportedContent">
        <ul class="navbar-nav ml-auto">
          {#if $user.isCompany}
            <li class="nav-item">
              <a class="nav-link" href="#/dashboard/invite">Invite Employee</a>
            </li>
          {/if}
          {#if !$user.isCompany}
            <li class="nav-item">
              <a class="nav-link" href="#/dashboard/shifts">Shifts</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#/dashboard/invitations">Invitations</a>
            </li>
          {/if}
          <li class="nav-item dropdown">
            <a
              class="nav-link dropdown-toggle"
              href="#/"
              id="navbarDropdown"
              role="button"
              data-toggle="dropdown"
              aria-haspopup="true"
              aria-expanded="false">
              {#if $user.email !== undefined}{$user.email}{:else}Loading...{/if}
            </a>
            <div class="dropdown-menu" aria-labelledby="navbarDropdown">
              <a class="dropdown-item" href="#/">Profile</a>
              <div class="dropdown-divider" />
              <a on:click={handleLogout} class="dropdown-item" href="#/">
                Logout
              </a>
            </div>
          </li>
        </ul>
      </div>
    {/if}
  </nav>
</main>
