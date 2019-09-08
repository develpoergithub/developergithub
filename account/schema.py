from django.contrib.auth import get_user_model
import graphene
from graphene_django import DjangoObjectType
from .models import User, UserConnection, UserActivation
import graphql_jwt
from graphql_jwt.decorators import login_required


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
