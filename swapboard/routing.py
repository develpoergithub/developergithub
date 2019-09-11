from django.urls import path
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from channels.security.websocket import AllowedHostsOriginValidator
from .consumers import ChannelsGraphqlWSConsumer

application = ProtocolTypeRouter({
    # Insert urls here, http is handled by default
    "websocket": AllowedHostsOriginValidator(AuthMiddlewareStack(
        URLRouter([
            path("graphql", ChannelsGraphqlWSConsumer),
        ])
    ))
})
