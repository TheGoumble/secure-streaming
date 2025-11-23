package config;

import controller.VideoStreamHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.context.ApplicationContext; 
import org.springframework.context.annotation.Bean;
import org.springframework.web.socket.server.standard.ServletServerContainerFactoryBean;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    // 1. Inject the Spring ApplicationContext
    private final ApplicationContext applicationContext;

    public WebSocketConfig(ApplicationContext applicationContext) {
        this.applicationContext = applicationContext;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        // 2. Explicitly retrieve the bean from the context, ensuring it is fully constructed
        VideoStreamHandler videoStreamHandler
                = applicationContext.getBean(VideoStreamHandler.class);

        // 3. Register the handler
        // Spring's registry.addHandler() will correctly cast the retrieved bean 
        // because it knows the bean is an instance of a TextWebSocketHandler.
        registry.addHandler(videoStreamHandler, "/stream").setAllowedOriginPatterns("*");
    }

    @Bean
    public ServletServerContainerFactoryBean createWebSocketContainer() {
        ServletServerContainerFactoryBean container = new ServletServerContainerFactoryBean();
        // Set max text message size to 2MB (2 * 1024 * 1024 bytes)
        container.setMaxTextMessageBufferSize(2097152);
        // Set max binary message size, just in case (2MB)
        container.setMaxBinaryMessageBufferSize(2097152);
        return container;
    }
}
