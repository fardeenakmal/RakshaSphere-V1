package com.rakshasphere.service;

import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;

@Service
public class EBpfDriver {

    private boolean nativeLoaded = false;

    @PostConstruct
    public void init() {
        try {
            // In a real environment, we'd load "bpf" or our custom "ebpfdriver"
            System.loadLibrary("ebpfdriver");
            nativeLoaded = true;
            System.out.println("Successfully loaded native eBPF JNI driver.");
        } catch (UnsatisfiedLinkError e) {
            nativeLoaded = false;
            System.err.println("Native code library failed to load.\n" + e);
        }
    }

    public boolean isNativeLoaded() {
        return nativeLoaded;
    }

    /**
     * Native method to simulate injecting an eBPF XDP drop rule for a specific IP.
     * @param ipAddress The IP address to block.
     * @return 0 on success, non-zero on failure.
     */
    public native int injectDropRule(String ipAddress);
}
