package com.example.B2BProyect.config;

import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketAuthChannelInterceptor implements ChannelInterceptor {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");

            if (authHeader == null) {
                throw new IllegalArgumentException("Missing Authorization header in STOMP CONNECT");
            }

            String token = jwtTokenProvider.resolveToken(authHeader);
            if (token == null) {
                throw new IllegalArgumentException("Invalid Authorization header format");
            }

            Optional<Authentication> authentication = jwtTokenProvider.validateToken(token);
            if (authentication.isEmpty()) {
                throw new IllegalArgumentException("Invalid or expired JWT");
            }

            accessor.setUser(authentication.get());
            log.info("WebSocket authenticated as: {}", authentication.get().getName());
        }

        return message;
    }
}