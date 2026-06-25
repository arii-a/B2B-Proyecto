package com.example.B2BProyect.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.ModelMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@Controller
public class AppController {

    @GetMapping("/")
    String home(ModelMap modal) {
        modal.addAttribute("title","EVENTOP V1");
        return "forward:/index.html";
    }

    @GetMapping({
            "/configuracion/**",
            "/monitoreo/**",
            "/login",
            "/security/**",
            "/access/**",})
    String partialHandler(/*@PathVariable("page") final String page*/) {
        return "forward:/index.html";
    }
}
