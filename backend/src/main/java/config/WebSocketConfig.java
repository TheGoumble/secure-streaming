package config;

import controller.VideoStreamHandler;
import controller.ChatWebSocketHandler;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.web.socket.server.standard.ServletServerContainerFactoryBean;

/**
 * Configures WebSocket endpoints for video streaming and chat functionality.
 * Sets buffer sizes to 2MB to accommodate encrypted video frames.
 */
@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final ApplicationContext applicationContext;

    public WebSocketConfig(ApplicationContext applicationContext) {
        this.applicationContext = applicationContext;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        VideoStreamHandler videoStreamHandler =
                applicationContext.getBean(VideoStreamHandler.class);

        ChatWebSocketHandler chatWebSocketHandler =
                applicationContext.getBean(ChatWebSocketHandler.class);

        registry.addHandler(videoStreamHandler, "/stream")
                .setAllowedOriginPatterns("*");

        registry.addHandler(chatWebSocketHandler, "/chat")
                .setAllowedOriginPatterns("*");
    }

    @Bean
    public ServletServerContainerFactoryBean createWebSocketContainer() {
        ServletServerContainerFactoryBean container =
                new ServletServerContainerFactoryBean();

        // Increase text & binary buffer sizes (2MB) for potential frame size
        container.setMaxTextMessageBufferSize(2 * 1024 * 1024);
        container.setMaxBinaryMessageBufferSize(2 * 1024 * 1024);

        return container;
    }
}