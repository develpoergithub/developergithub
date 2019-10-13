<script>
  import { push, location } from "svelte-spa-router";
  import { isLoggedIn } from "./store.js";

  if ($isLoggedIn === false) {
    if ($location === "/" || $location === "/dashboard/") {
      push("/login");
    }
  } else {
    push("/dashboard/shifts");
  }
  // console.log("I am at : " + $location);
</script>
