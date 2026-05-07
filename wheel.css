.wheel-container {
    position: relative;
    width: 300px;
    height: 300px;
    margin: 2rem auto;
    display: flex;
    align-items: center;
    justify-content: center;
}

.wheel-pointer {
    position: absolute;
    top: 50%;
    left: 100%;
    transform: translateY(-50%) translateX(-10px);
    width: 0;
    height: 0;
    border-top: 15px solid transparent;
    border-bottom: 15px solid transparent;
    border-left: 30px solid var(--primary-color);
    z-index: 2;
}

.wheel {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 3px solid #444;
    position: relative;
    overflow: hidden;
    transition: transform 5s cubic-bezier(0.25, 1, 0.5, 1);
    /* Background is now dynamically handled via JS conic-gradient */
}

.wheel-spoke-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    transform-origin: center center;
}

.wheel-spoke-text {
    position: absolute;
    top: 12%;
    left: 50%;
    transform: translateX(-50%);
    color: #fff;
    font-weight: bold;
    font-size: 0.9em;
    white-space: nowrap;
    text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
    z-index: 1;
}

.wheel-spoke-text.double-or-nothing {
    color: #ffd700; /* Bright Gold */
    font-weight: 900;
    font-size: 1em;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 1);
}
