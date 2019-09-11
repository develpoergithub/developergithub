import graphene
import channels_graphql_ws
from account.schema import TestMutation, TestSubscription, ChannelsLogin, ChannelsUserQuery


class Mutation(graphene.ObjectType):
    test_mutation = TestMutation.Field()
    channels_login = ChannelsLogin.Field()


class Subscription(graphene.ObjectType):
    test_subscription = TestSubscription.Field()


class Query(ChannelsUserQuery, graphene.ObjectType):
    pass


channels_schema = graphene.Schema(
    query=Query,
    mutation=Mutation,
    subscription=Subscription,
)
