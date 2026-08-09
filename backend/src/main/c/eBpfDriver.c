#include <jni.h>
#include <stdio.h>
#include <string.h>

JNIEXPORT jint JNICALL Java_com_rakshasphere_service_EBpfDriver_injectDropRule
  (JNIEnv *env, jobject obj, jstring ipAddress) {
    
    // Convert jstring to C string
    const char *ip_str = (*env)->GetStringUTFChars(env, ipAddress, 0);
    
    if (ip_str == NULL) {
        return -1; // Out of memory
    }

    // Simulate interacting with libbpf to attach an XDP program
    printf("[NATIVE eBPF] Attaching XDP drop rule for IP: %s to interface eth0...\n", ip_str);
    printf("[NATIVE eBPF] libbpf: successfully loaded BPF object\n");
    printf("[NATIVE eBPF] libbpf: successfully attached XDP program\n");
    
    // Release the string
    (*env)->ReleaseStringUTFChars(env, ipAddress, ip_str);
    
    // Return 0 for success
    return 0;
}
