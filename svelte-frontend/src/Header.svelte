<script>
  import { push } from "svelte-spa-router";
  import {
    keepMeLoggedIn,
    isLoggedIn,
    refreshToken,
    user,
    connections,
    selectedCompany,
    menuDisplayed
  } from "./store.js";
  import { logout } from "./authMethods.js";

  let selectedUserConnection;

  function handleLogout() {
    logout();
  }

  function toggleMenu() {
    menuDisplayed.set(!$menuDisplayed);
  }

  function assignSelectedCompany() {
    selectedCompany.set(selectedUserConnection.company);
  }
</script>

<style>
  .navbar {
    max-height: 55px !important;
  }
  .navbar-brand {
    margin-left: 10px;
  }

  @media screen and (max-width: 640px) {
    #menu-toggler {
      /* display: none; */
    }
  }

  .dropdown-menu {
    z-index: 99999;
  }
</style>

<main>
  <nav class="navbar fixed-top navbar-expand-sm navbar-light bg-light">
    {#if $isLoggedIn}
      <button on:click={toggleMenu} id="menu-toggler" class="btn bg-light">
        <span class="navbar-toggler-icon" />
      </button>
    {/if}
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
          <!-- {#if $user.isCompany}
            <li class="nav-item">
              <a class="nav-link" href="#/dashboard/invite">Invite Employee</a>
            </li>
          {/if}
          {#if !$user.isCompany}
            <li class="nav-item">
              <a class="nav-link" href="#/dashboard/postshift">Post Shift</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#/dashboard/shifts">Shifts</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#/dashboard/invitations">Invitations</a>
            </li>
          {/if} -->
          {#if !$user.isCompany}
            <li class="nav-item">
              <div class="input-group mb-3">
                <select
                  on:change={assignSelectedCompany}
                  bind:value={selectedUserConnection}
                  id="company-selector"
                  class="custom-select">
                  <option value="" selected disabled hidden>
                    Select Company
                  </option>
                  {#if $connections.length > 0}
                    {#each $connections as choice}
                      <option value={choice}>
                        {choice.company.userprofile.companyName}
                      </option>
                    {/each}
                  {/if}
                </select>
              </div>
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
