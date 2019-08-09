<script context="module">
  import Home from "./Home.svelte";
  import SignUp from "./account/SignUp.svelte";
  import LogIn from "./account/LogIn.svelte";
  import ForgotPassword from "./account/ForgotPassword.svelte";
  import RecoverAccount from "./account/RecoverAccount.svelte";
  import VerifyAccount from "./account/VerifyAccount.svelte";
  import DashBoard from "./dashboard/DashBoard.svelte";
  import NotFound from "./NotFound.svelte";

  export const routes = {
    "/": Home,
    "/login": LogIn,
    "/signup": SignUp,
    "/verifyaccount": VerifyAccount,
    "/forgotpassword": ForgotPassword,
    "/recoveraccount": RecoverAccount,
    "/dashboard/*": DashBoard,
    "*": NotFound
  };
</script>
