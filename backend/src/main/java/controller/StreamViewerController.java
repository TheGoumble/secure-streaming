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
    private static final String CONTENT_TYPE = "multipart/x-mixed-replace; boundary=" + BOUNDARY;

    /**
     * Streams decrypted video to viewers via MJPEG over HTTP.
     * Continuously sends JPEG frames with multipart boundaries until stream ends.
     * Frame rate is controlled at ~20 FPS (50ms delay between frames).
     * 
     * @param username The streamer's username/session ID
     * @param response HTTP response stream for MJPEG output
     */
    @GetMapping("/view/{username}")
    public void viewStream(@PathVariable String username, HttpServletResponse response) {
        
        System.out.println("Viewer attempting to connect to stream: " + username);
        
        if (!streamManager.isStreaming(username)) {
            System.out.println("Stream not found or not active for: " + username);
            response.setStatus(HttpStatus.NOT_FOUND.value());
            return;
        }

        System.out.println("Stream is active for: " + username + ", starting MJPEG stream...");
        
        // Configure MJPEG streaming headers with no-cache policy
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
                    emptyFrameCount = 0;
                    
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
                    emptyFrameCount++;
                    if (emptyFrameCount == 1) {
                        System.out.println("Waiting for first frame from: " + username);
                    }
                }

                Thread.sleep(50); 
            }
            System.out.println("Stream ended for: " + username + " after " + frameCount + " frames");
        } catch (IOException e) {
            System.out.println("Viewer connection closed for: " + username + " - " + e.getMessage());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            System.out.println("Stream interrupted for: " + username);
        }
    }
}