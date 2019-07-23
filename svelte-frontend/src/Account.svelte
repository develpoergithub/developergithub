<script>
  import { getClient, query } from "svelte-apollo";
  import { gql } from "apollo-boost";

  const GET_USERS = gql`
    {
      users {
        id
        email
        isCompany
      }
    }
  `;
  const client = getClient();
  const users = query(client, { query: GET_USERS });
</script>

<h2>Account</h2>
{#await $users}
  Loading Users...
{:then result}
  {JSON.stringify(result)}
{:catch error}
  {error}
{/await}
