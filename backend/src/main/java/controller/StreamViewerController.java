package controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import service.StreamManager;
import java.io.IOException;
import jakarta.servlet.http.HttpServletResponse;

import java.io.OutputStream;

@RestController
public class StreamViewerController {

    private final StreamManager streamManager;

    public StreamViewerController(StreamManager streamManager) {
        this.streamManager = streamManager;
    }

    private static final String BOUNDARY = "--frameboundary";
    private static final String CONTENT_TYPE = "multipart/x-mixed-replace; boundary=" + BOUNDARY;

    @GetMapping("/view/{username}")
    public void viewStream(@PathVariable String username, HttpServletResponse response) {
        
        if (!streamManager.isStreaming(username)) {
            response.setStatus(HttpStatus.NOT_FOUND.value());
            return;
        }

        // 1. Set MJPEG Streaming Headers
        response.setContentType(CONTENT_TYPE);
        response.setHeader(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate");
        response.setHeader(HttpHeaders.PRAGMA, "no-cache");
        
        try (OutputStream outputStream = response.getOutputStream()) {
            while (streamManager.isStreaming(username)) {
                byte[] frame = streamManager.getLatestFrame(username);
                
                if (frame != null && frame.length > 0) {
                    // 2. Write MJPEG Frame Components
                    outputStream.write(("\r\n" + BOUNDARY + "\r\n").getBytes());
                    outputStream.write(("Content-Type: image/jpeg\r\n").getBytes());
                    outputStream.write(("Content-Length: " + frame.length + "\r\n\r\n").getBytes());
                    outputStream.write(frame);
                    outputStream.flush();
                }

                // 3. Control frame rate (e.g., 20 FPS = 50ms delay)
                Thread.sleep(50); 
            }
        } catch (IOException e) {
            // Connection closed by client (viewer navigated away)
            System.out.println("Viewer connection closed for: " + username);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        // Stream finished when the loop exits
    }
}