package com.rakshasphere.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.concurrent.TimeUnit;

@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    private static final Logger log = LoggerFactory.getLogger(RateLimitInterceptor.class);

    @Autowired
    private StringRedisTemplate redisTemplate;

    @Value("${rate-limit.max-requests-per-minute:100}")
    private int maxRequestsPerMinute;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        try {
            String clientIp = request.getRemoteAddr();
            String key = "rate_limit:" + clientIp;

            Long currentCount = redisTemplate.opsForValue().increment(key);
            
            if (currentCount != null && currentCount == 1) {
                redisTemplate.expire(key, 1, TimeUnit.MINUTES);
            }

            if (currentCount != null && currentCount > maxRequestsPerMinute) {
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.getWriter().write("429 Too Many Requests - Rate limit exceeded. Try again later.");
                return false;
            }
        } catch (Exception ex) {
            // Graceful degradation: if Redis is unavailable, allow the request through
            log.warn("Redis unavailable for rate limiting, allowing request: {}", ex.getMessage());
        }

        return true;
    }
}

