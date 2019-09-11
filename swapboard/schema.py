import graphene
import graphql_jwt
import channels_graphql_ws
from account.schema import (
    CreateUser,
    ActivateUser,
    ObtainJSONWebToken,
    CreateUserConnection,
    ConfirmUserConnection,
    UserQuery,
)
from user_profile.schema import UpdateUserProfile, UserProfileQuery
from shift.schema import (
    CreateShift,
    CreateShiftConnection,
    ConfirmShiftConnection,
    ShiftQuery,
)


class RootQuery(UserQuery, UserProfileQuery, ShiftQuery, graphene.ObjectType):
    pass
    # def resolve_viewer(self, info, **kwargs):
    #     if info.context.user.is_authenticated:
    #         return info.context.user
    #     return Exception('Not Logged In')


class Mutation(graphene.ObjectType):
    token_auth = ObtainJSONWebToken.Field()
    verify_token = graphql_jwt.Verify.Field()
    refresh_token = graphql_jwt.Refresh.Field()
    revoke_token = graphql_jwt.Revoke.Field()
    create_user = CreateUser.Field()
    activate_user = ActivateUser.Field()
    update_user_profile = UpdateUserProfile.Field()
    create_user_connection = CreateUserConnection.Field()
    confirm_user_connection = ConfirmUserConnection.Field()
    create_shift = CreateShift.Field()
    create_shift_connection = CreateShiftConnection.Field()
    confirm_shift_connection = ConfirmShiftConnection.Field()


schema = graphene.Schema(
    query=RootQuery,
    mutation=Mutation,
)
