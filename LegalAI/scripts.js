js
document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 100,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Check if any URL parameters were passed
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('success')) {
        showMessage("Document successfully created and saved!", "success");
    } else if (urlParams.has('error')) {
        showMessage("An error occurred: " + urlParams.get('error'), "error");
    }

    // Handle document type URL parameters for direct navigation
    if (urlParams.has('demo')) {
        setTimeout(() => {
            // Show a welcome demonstration message
            showMessage("Welcome to LegalVoice.AI demo! Explore our features.", "info", 5000);
        }, 1000);
    }

    // Function to check if element is in viewport for animations
    function isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    // Animate elements when they come into view
    const animateOnScroll = () => {
        document.querySelectorAll('.feature-card, .document-card, .testimonial').forEach(item => {
            if (isInViewport(item) && !item.classList.contains('animated')) {
                item.classList.add('animated');
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }
        });
    };

    // Apply initial styles for animation
    document.querySelectorAll('.feature-card, .document-card, .testimonial').forEach(item => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        item.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
    });

    // Listen for scroll events
    window.addEventListener('scroll', animateOnScroll);
    // Run once on page load
    animateOnScroll();

    // Display temporary message
    function showMessage(message, type = 'info', duration = 3000) {
        // Check if message element exists, create it if not
        let messageElement = document.getElementById('status-message');
        if (!messageElement) {
            messageElement = document.createElement('div');
            messageElement.id = 'status-message';
            messageElement.className = 'status-message';
            document.body.appendChild(messageElement);
        }
        
        // Set message content and class based on type
        messageElement.textContent = message;
        messageElement.className = `status-message ${type}`;
        messageElement.style.display = 'block';
        
        // Hide message after duration
        setTimeout(() => {
            messageElement.style.display = 'none';
        }, duration);
    }

    // Fix hero image loading
    const heroImage = document.querySelector('.hero-image img');
    if (heroImage) {
        heroImage.onerror = function() {
            this.src = 'placeholder-hero.png';  // Fallback image if main one fails to load
        };
    }

    // Fix for old browsers that don't support some features
    if (!window.IntersectionObserver) {
        document.querySelectorAll('.feature-card, .document-card, .testimonial').forEach(item => {
            item.style.opacity = '1';
            item.style.transform = 'none';
        });
    }
});