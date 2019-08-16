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
        company_id = graphene.ID()

    @login_required
    def mutate(self, info, company_id):

        try:
            company = User.objects.get(id=company_id)
        except User.DoesNotExist:
            raise Exception("CAN NOT Resolve the Company from id")

        if not company.is_company:
            raise Exception(
                "The Requested to UserConnection must be a Company")

        user = info.context.user
        if user.is_company:
            raise Exception("A Company Can not Initiate a UserConnection")

        try:
            user_connection = UserConnection.objects.get(
                company=company, employee=user)
            return CreateUserConnection(user_connection=user_connection)
            # raise Exception("The Requested Connection already exist!")
        except UserConnection.DoesNotExist:
            pass

        user_connection = UserConnection(
            employee=info.context.user, company=company, is_confirmed=False
        )

        user_connection.save()

        return CreateUserConnection(user_connection=user_connection)


class ConfirmUserConnection(graphene.Mutation):
    user_connection = graphene.Field(UserConnectionType)

    class Arguments:
        user_connection_id = graphene.ID()

    @login_required
    def mutate(self, info, user_connection_id):

        if not info.context.user.is_company:
            raise Exception("User Must be a Company to Perform this Operation")

        user_connection = UserConnection.objects.get(id=user_connection_id)
        user_connection.is_confirmed = True
        user_connection.save()

        return ConfirmUserConnection(user_connection=user_connection)


class UserQuery(graphene.ObjectType):
    me = graphene.Field(UserType)
    users = graphene.List(UserType)
    all_user_connections = graphene.List(UserConnectionType)
    user_connections = graphene.List(UserConnectionType)

    def resolve_me(self, info):
        user = info.context.user
        if user.is_anonymous:
            raise Exception("You are Not Logged In!")
        return user

    @login_required
    def resolve_user_connections(self, info):
        if info.context.user.is_company:
            return UserConnection.objects.filter(company=info.context.user)
        elif info.context.user.is_company == False:
            return UserConnection.objects.filter(employee=info.context.user)

    # Not Secured, For Testing Only!

    def resolve_users(self, info):
        return get_user_model().objects.all()

    def resolve_all_user_connections(self, info):
        return UserConnection.objects.all()
