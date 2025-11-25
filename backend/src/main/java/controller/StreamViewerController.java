package controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import service.StreamManager;
import java.io.IOException;
import jakarta.servlet.http.HttpServletResponse;

import java.io.OutputStream;

@RestController
@CrossOrigin(origins = "http://localhost:3000")
public class StreamViewerController {

    private final StreamManager streamManager;

    public StreamViewerController(StreamManager streamManager) {
        this.streamManager = streamManager;
    }

    private static final String BOUNDARY = "--frameboundary";
    // Mime type for Motion JPEG (MJPEG) streaming
    private static final String CONTENT_TYPE = "multipart/x-mixed-replace; boundary=" + BOUNDARY;

    @GetMapping("/view/{username}")
    public void viewStream(@PathVariable String username, HttpServletResponse response) {
        
        System.out.println("Viewer attempting to connect to stream: " + username);
        
        if (!streamManager.isStreaming(username)) {
            System.out.println("Stream not found or not active for: " + username);
            response.setStatus(HttpStatus.NOT_FOUND.value());
            return;
        }

        System.out.println("Stream is active for: " + username + ", starting MJPEG stream...");
        
        // 1. Set MJPEG Streaming Headers
        // Note: Cross-Origin is not required here because the browser requests this image stream
        // directly from the backend, not via the fetch API.
        response.setContentType(CONTENT_TYPE);
        response.setHeader(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate");
        response.setHeader(HttpHeaders.PRAGMA, "no-cache");
        response.setHeader(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "http://localhost:3000");
        
        try (OutputStream outputStream = response.getOutputStream()) {
            int frameCount = 0;
            int emptyFrameCount = 0;
            while (streamManager.isStreaming(username)) {
                byte[] frame = streamManager.getLatestFrame(username);
                
                if (frame != null && frame.length > 0) {
                    // Reset empty frame counter
                    emptyFrameCount = 0;
                    
                    // 2. Write MJPEG Frame Components
                    outputStream.write(("\r\n" + BOUNDARY + "\r\n").getBytes());
                    outputStream.write(("Content-Type: image/jpeg\r\n").getBytes());
                    outputStream.write(("Content-Length: " + frame.length + "\r\n\r\n").getBytes());
                    outputStream.write(frame);
                    outputStream.flush();
                    frameCount++;
                    
                    if (frameCount % 50 == 0) {
                        System.out.println("Sent " + frameCount + " frames to viewer for: " + username);
                    }
                } else {
                    // Stream is registered but no frames yet - wait for first frame
                    emptyFrameCount++;
                    if (emptyFrameCount == 1) {
                        System.out.println("Waiting for first frame from: " + username);
                    }
                }

                // 3. Control frame rate (e.g., 20 FPS = 50ms delay)
                Thread.sleep(50); 
            }
            System.out.println("Stream ended for: " + username + " after " + frameCount + " frames");
        } catch (IOException e) {
            // Connection closed by client (viewer navigated away)
            System.out.println("Viewer connection closed for: " + username + " - " + e.getMessage());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            System.out.println("Stream interrupted for: " + username);
        }
        
        // Stream finished when the loop exits
    }
}