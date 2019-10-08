import asgiref
import channels
import channels.auth
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
import graphene
from graphene_django import DjangoObjectType
from .models import User, UserConnection, UserActivation
import graphql_jwt
from graphql_jwt.decorators import login_required
import channels_graphql_ws
from user_profile.schema import UserProfileType


class UserType(DjangoObjectType):
    class Meta:
        model = get_user_model()
        exclude = ("password",)


class UserConnectionType(DjangoObjectType):
    class Meta:
        model = UserConnection


class UserActivationType(DjangoObjectType):
    class Meta:
        model = UserActivation


class CreateUser(graphene.Mutation):
    user = graphene.Field(UserType)

    class Arguments:
        is_company = graphene.Boolean(required=True)
        email = graphene.String(required=True)
        password = graphene.String(required=True)
        name = graphene.String(required=True)

    def mutate(self, info, is_company, email, password, name):
        email = email.strip()
        password = password.strip()

        if not name.strip() or not email or not password:
            raise Exception("One or more of your fields are empty")

        user = get_user_model()(is_company=is_company, email=email, username=name)
        user.is_active = False
        user.set_password(password)
        user.save()

        return CreateUser(user=user)


class ActivateUser(graphene.Mutation):
    activated = graphene.Boolean()

    class Arguments:
        email = graphene.String(required=True)
        # password = graphene.String(required=True)
        code = graphene.String(required=True)

    def mutate(self, info, code, email):
        user = None
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise Exception("CAN NOT Resolve the User from email")

        try:
            activation = UserActivation.objects.get(user=user, code=code)
            user.is_active = True
            user.save()
        except UserActivation.DoesNotExist:
            raise Exception("CAN NOT Resolve the UserActivation from code")

        return ActivateUser(activated=True)


class CreateUserConnection(graphene.Mutation):
    user_connection = graphene.Field(UserConnectionType)

    class Arguments:
        employee_email = graphene.String(required=True)

    @login_required
    def mutate(self, info, employee_email):

        # try:
        #     employee = User.objects.get(email=employee_email)
        # except User.DoesNotExist:
        #     raise Exception("CAN NOT Resolve the Employee from id")

        # if not company.is_company:
        #     raise Exception(
        #         "The Requested to UserConnection must be a Company")

        user = info.context.user
        if not user.is_company:
            raise Exception("An Employee Can not Initiate a UserConnection")

        try:
            user_connection = UserConnection.objects.get(
                company=user, employee_email=employee_email)
            # user_connection.save()
            return CreateUserConnection(user_connection=user_connection)
            # raise Exception("The Requested Connection already exist!")
        except UserConnection.DoesNotExist:
            pass

        user_connection = UserConnection(
            company=info.context.user, employee_email=employee_email, is_confirmed=False
        )

        user_connection.save()

        return CreateUserConnection(user_connection=user_connection)


class ConfirmUserConnection(graphene.Mutation):
    user_connection = graphene.Field(UserConnectionType)

    class Arguments:
        user_connection_id = graphene.ID()

    @login_required
    def mutate(self, info, user_connection_id):

        if info.context.user.is_company:
            raise Exception(
                "User Must be an Employee to Perform this Operation")
        try:
            user_connection = UserConnection.objects.get(id=user_connection_id)

            if user_connection.employee == info.context.user:
                return ConfirmUserConnection(user_connection=user_connection)

            if user_connection.employee_email != info.context.user.email:
                raise Exception("Can not accept an invite that is not yours")

            user_connection.employee = info.context.user
            user_connection.is_confirmed = True
            user_connection.save()
            return ConfirmUserConnection(user_connection=user_connection)
        except UserConnection.DoesNotExist:
            raise Exception("Please make sure you passed in a valid ID!")


class UserQuery(graphene.ObjectType):
    me = graphene.Field(UserType)
    users = graphene.List(UserType)
    all_user_connections = graphene.List(UserConnectionType)
    invitations = graphene.List(UserConnectionType)
    connections = graphene.List(UserConnectionType)

    def resolve_me(self, info):
        user = info.context.user
        if user.is_anonymous:
            raise Exception("You are Not Logged In!")
        return user

    @login_required
    def resolve_invitations(self, info):
        if info.context.user.is_company:
            return UserConnection.objects.filter(company=info.context.user)
        elif not info.context.user.is_company:
            result = []
            invites = UserConnection.objects.filter(
                employee_email=info.context.user.email)
            for item in invites:
                if not item.is_confirmed and not item.is_declined:
                    result.append(item)
            return result

    @login_required
    def resolve_connections(self, info):
        if info.context.user.is_company:
            return UserConnection.objects.filter(company=info.context.user)
        else:
            return UserConnection.objects.filter(employee=info.context.user)

    # Not Secured, For Testing Only!

    def resolve_users(self, info):
        return get_user_model().objects.all()

    def resolve_all_user_connections(self, info):
        return UserConnection.objects.all()


class ObtainJSONWebToken(graphql_jwt.JSONWebTokenMutation):
    user = graphene.Field(UserType)

    @classmethod
    def resolve(cls, root, info, **kwargs):
        user = info.context.user
        return cls(user)


class ChannelsLogin(graphene.Mutation):
    logged_in = graphene.Boolean()
    user = graphene.Field(UserType)

    class Arguments:
        user_id = graphene.ID()

    def mutate(self, info, user_id):
        try:
            user = User.objects.get(id=user_id)
            # Use Channels to login, in other words to put proper data to
            # the session stored in the scope. The `info.context` is
            # practically just a wrapper around Channel `self.scope`, but
            # the `login` method requires dict, so use `_asdict`.
            asgiref.sync.async_to_sync(channels.auth.login)(
                info.context._asdict(), user, backend='django.contrib.auth.backends.ModelBackend')
            # Save the session,cause `channels.auth.login` does not do this.
            info.context.session.save()
            return ChannelsLogin(user=user, logged_in=True)
        except User.DoesNotExist:
            return ChannelsLogin(user=None, logged_in=False)


class ChannelsUserQuery(graphene.ObjectType):
    me = graphene.Field(UserType)

    def resolve_me(self, info):
        user = info.context.user
        if user.is_anonymous:
            raise Exception("You are Not Logged In!")
        return user


class TestMutation(graphene.Mutation):
    worked = graphene.Boolean()

    class Arguments:
        message = graphene.String()
        groupId = graphene.ID()

    async def mutate(self, info, groupId, message):
        if info.context.user.is_authenticated:
            await TestSubscription.broadcast_async(
                group=groupId,
                payload=info.context.user
            )

            return TestMutation(worked=True)

        return TestMutation(worked=False)


class TestSubscription(channels_graphql_ws.Subscription):
    """Simple GraphQL subscription."""

    # Subscription payload.
    event = graphene.Field(UserType)

    class Arguments:
        """That is how subscription arguments are defined."""
        groupId = graphene.ID()

    @staticmethod
    def subscribe(root, info, groupId):
        """Called when user subscribes."""

        # Return the list of subscription group names.
        if info.context.user.is_authenticated:
            return [str(info.context.user.id)]
        raise Exception("You Must Be Logged In To Subscribe")

    @staticmethod
    def publish(payload, info, groupId):
        """Called to notify the client."""

        # Here `payload` contains the `payload` from the `broadcast()`
        # invocation (see below). You can return `MySubscription.SKIP`
        # if you wish to suppress the notification to a particular
        # client. For example, this allows to avoid notifications for
        # the actions made by this particular client.

        return TestSubscription(event=payload)
