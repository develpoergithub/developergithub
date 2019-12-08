<script context="module">
  import Home from "./Home.svelte";
  import SignUp from "./account/SignUp.svelte";
  import LogIn from "./account/LogIn.svelte";
  import ForgotPassword from "./account/ForgotPassword.svelte";
  import RecoverAccount from "./account/RecoverAccount.svelte";
  import VerifyAccount from "./account/VerifyAccount.svelte";
  import DashBoard from "./dashboard/DashBoard.svelte";
  import ConfirmInvitation from "./ConfirmInvitation.svelte";
  import InviteEmployee from "./dashboard/InviteEmployee.svelte";
  import Invitations from "./dashboard/Invitations.svelte";
  import Shifts from "./dashboard/Shifts.svelte";
  import PostShift from "./dashboard/PostShift.svelte";
  import MyShifts from "./dashboard/MyShifts.svelte";
  import ShiftRequests from "./dashboard/ShiftRequests.svelte";
  import ProposedShifts from "./dashboard/ProposedShifts.svelte";
  import NotFound from "./NotFound.svelte";

  export const routes = {
    "/": Home,
    "/login": LogIn,
    "/signup": SignUp,
    "/verifyaccount": VerifyAccount,
    "/forgotpassword": ForgotPassword,
    "/recoveraccount": RecoverAccount,
    "/dashboard": DashBoard,
    "/confirminvitation/:id": ConfirmInvitation,
    "/dashboard/invite": InviteEmployee,
    "/dashboard/invitations": Invitations,
    "/dashboard/shifts": Shifts,
    "/dashboard/postshift": PostShift,
    "/dashboard/myshifts": MyShifts,
    "/dashboard/shiftrequests": ShiftRequests,
    "/dashboard/proposedshifts": ProposedShifts,
    "*": NotFound
  };
</script>
