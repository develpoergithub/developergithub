import graphene
from graphene_django import DjangoObjectType
from .models import UserProfile
from graphql_jwt.decorators import login_required


class UserProfileType(DjangoObjectType):
    class Meta:
        model = UserProfile


class UpdateUserProfile(graphene.Mutation):
    class Arguments:
        first_name = graphene.String()
        last_name = graphene.String()
        age = graphene.Int()
        company_name = graphene.String()
        company_address = graphene.String()
        email = graphene.String()
        tel = graphene.String()
        url = graphene.String()
        photo_url = graphene.String()
        admin_name = graphene.String()
        company_position = graphene.String()

    # The class attributes define the response of the mutation
    profile = graphene.Field(UserProfileType)

    @login_required
    def mutate(self, info, **args):

        profile = UserProfile.objects.get(user=info.context.user)

        # Assign the New Fields Here!
        if not info.context.user.is_company:
            profile.first_name = args.pop("first_name")
            profile.last_name = args.pop("last_name")
            profile.age = args.pop("age")
            profile.email = args.pop("email")
            profile.photo_url = args.pop("photo_url")
            tel = args.pop("tel")
        else:
            profile.admin_name = args.pop("admin_name")
            profile.company_name = args.pop("company_name")
            profile.company_address = args.pop("company_address")
            profile.company_position = args.pop("company_position")
            profile.url = args.pop("url")
            profile.email = args.pop("email")
            profile.photo_url = args.pop("photo_url")
            tel = args.pop("tel")

        profile.save()
        # Notice we return an instance of this mutation
        return UpdateUserProfile(profile=profile)


class UserProfileQuery(graphene.ObjectType):
    all_user_profiles = graphene.List(UserProfileType)
    user_profile = graphene.Field(UserProfileType)

    @login_required
    def resolve_user_profile(self, info):
        return UserProfile.objects.get(user=info.context.user)

    def resolve_all_user_profiles(self, info):
        return UserProfile.objects.all()
