package com.testmanagement.integration;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureWebMvc
@ActiveProfiles("test")
public class UserServiceIntegrationTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Test
    void testUserEndpointHealth() throws Exception {
        mockMvc.perform(get("/api/users/health"))
               .andExpect(status().isOk())
               .andExpect(content().string("User service is healthy"));
    }
    
    @Test
    void testGetUsersEndpoint() throws Exception {
        mockMvc.perform(get("/api/users"))
               .andExpect(status().isOk())
               .andExpect(content().contentType("application/json"));
    }
    
    @Test
    void testCreateUserEndpoint() throws Exception {
        String userJson = "{\"name\":\"John Doe\",\"email\":\"john@example.com\"}";
        
        mockMvc.perform(post("/api/users")
               .contentType("application/json")
               .content(userJson))
               .andExpect(status().isCreated())
               .andExpect(jsonPath("$.name").value("John Doe"))
               .andExpect(jsonPath("$.email").value("john@example.com"));
    }
    
    @Test
    void testGetUserByIdEndpoint() throws Exception {
        mockMvc.perform(get("/api/users/1"))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.id").value(1));
    }
    
    @Test
    void testUpdateUserEndpoint() throws Exception {
        String userJson = "{\"name\":\"Jane Doe\",\"email\":\"jane@example.com\"}";
        
        mockMvc.perform(put("/api/users/1")
               .contentType("application/json")
               .content(userJson))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.name").value("Jane Doe"));
    }
    
    @Test
    void testDeleteUserEndpoint() throws Exception {
        mockMvc.perform(delete("/api/users/1"))
               .andExpect(status().isNoContent());
    }
    
    @Test
    void testUserNotFound() throws Exception {
        mockMvc.perform(get("/api/users/999"))
               .andExpect(status().isNotFound());
    }
}
