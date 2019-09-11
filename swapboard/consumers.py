import asyncio
import channels
import channels_graphql_ws
from .channels_schema import channels_schema


class ChannelsGraphqlWSConsumer(channels_graphql_ws.GraphqlWsConsumer):
    schema = channels_schema

    # Uncomment to send keepalive message every 42 seconds.
    # send_keepalive_every = 42

    # Uncomment to process requests sequentially (useful for tests).
    # strict_ordering = True

    async def on_connect(self, payload):
        """New client connection handler."""
        # You can `raise` from here to reject the connection.
        print("new client connected")
