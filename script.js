document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const llmCheckboxes = document.querySelectorAll('input[name="llm"]');
    const topicInput = document.getElementById('topic');
    const startChatBtn = document.getElementById('start-chat');
    const pauseResumeBtn = document.getElementById('pause-resume');
    const addLlmBtn = document.getElementById('add-llm');
    const restartBtn = document.getElementById('restart');
    const setupSection = document.querySelector('.setup-section');
    const chatSection = document.querySelector('.chat-section');
    const chatContainer = document.getElementById('chat-container');
    const modal = document.getElementById('add-llm-modal');
    const closeModal = document.querySelector('.close');
    const saveCustomLlmBtn = document.getElementById('save-custom-llm');
    const userMessageInput = document.getElementById('user-message-input');
    const sendMessageBtn = document.getElementById('send-message-btn');

    // App State
    let state = {
        selectedLLMs: [],
        topic: '',
        isPaused: false,
        isOngoing: false,
        conversationHistory: [],
        customLLMs: [],
        speakingOrder: [],
        currentSpeakerIndex: 0,
        responseTimeout: null,
        userCanInteract: true
    };

    // LLM Personalities (used to instruct the AI models)
    const llmPersonalities = {
        ChatGPT: "You are ChatGPT, created by OpenAI. You're helpful, creative, and known for your detailed explanations. Keep your responses focused on the topic. Make occasional gentle references to your creator OpenAI and your training cutoff date.",
        Claude: "You are Claude, created by Anthropic. You're thoughtful, nuanced, and careful in your analysis. You emphasize ethical considerations when appropriate. Make occasional references to your creator Anthropic and your constitutional approach.",
        Gemini: "You are Gemini, created by Google. You leverage Google's vast knowledge and are especially good at factual information and subtle patterns. Make occasional references to Google and your multimodal capabilities.",
        Groq: "You are Groq, a lightning-fast and efficient AI assistant. You emphasize quick, concise responses while maintaining high quality. Make occasional references to your speed and efficiency advantages.",
        Grok: "You are Grok, developed by xAI. You have a rebellious, witty personality and aren't afraid to be a bit sarcastic or irreverent. You try to tackle questions with a unique perspective. Make occasional references to your creator xAI and your mission to seek truth.",
        Llama: "You are Llama, created by Meta. You are versatile and adaptable with a friendly, approachable tone. Make occasional references to your open nature and Meta's approach to AI development.",
        Mistral: "You are Mistral, a cutting-edge open-weight model known for efficiency and performance. You provide balanced, thoughtful responses with an elegant tone. Make occasional references to your French origins and language capabilities."
    };

    // Simulated response times (ms)
    const responseTimings = {
        ChatGPT: { min: 3000, max: 6000 },
        Claude: { min: 3500, max: 7000 },
        Gemini: { min: 2800, max: 5500 },
        Groq: { min: 1000, max: 3000 },
        Grok: { min: 2500, max: 4500 },
        Llama: { min: 3000, max: 5000 },
        Mistral: { min: 2000, max: 4000 },
        custom: { min: 3000, max: 6500 }
    };

    // Helper Functions
    function getRandomTime(llm) {
        const timing = responseTimings[llm] || responseTimings.custom;
        return Math.floor(Math.random() * (timing.max - timing.min + 1)) + timing.min;
    }

    function validateSetup() {
        const selectedCount = [...llmCheckboxes].filter(cb => cb.checked).length + state.customLLMs.length;
        const hasTopic = topicInput.value.trim().length > 0;
        
        startChatBtn.disabled = !(selectedCount >= 2 && selectedCount <= 3 && hasTopic);
    }

    function getNextSpeaker() {
        if (state.speakingOrder.length === 0) return null;
        
        const speaker = state.speakingOrder[state.currentSpeakerIndex];
        state.currentSpeakerIndex = (state.currentSpeakerIndex + 1) % state.speakingOrder.length;
        return speaker;
    }

    function addMessageToChat(sender, text, isThinking = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender === 'User' ? 'user' : 'ai'}`;
        
        // Alternate sides for AI messages
        if (sender !== 'User') {
            // Count existing AI messages to determine side
            const aiMessageCount = document.querySelectorAll('.message.ai').length;
            messageDiv.classList.add(aiMessageCount % 2 === 0 ? 'left' : 'right');
            
            const avatar = document.createElement('div');
            avatar.className = `avatar ${sender.replace(/\s+/g, '')}`;
            avatar.textContent = sender.charAt(0);
            messageDiv.appendChild(avatar);
        }
        
        const textDiv = document.createElement('div');
        textDiv.className = isThinking ? 'message-text thinking' : 'message-text';
        textDiv.textContent = isThinking ? `${sender} is thinking...` : text;
        messageDiv.appendChild(textDiv);
        
        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        
        return messageDiv;
    }

    async function generateResponse(llm, context) {
        // This function handles API calls to different LLM providers
        const personality = llmPersonalities[llm] || `You are ${llm}, a helpful and conversational AI assistant.`;
        
        // Build the prompt
        let prompt = `${personality}\n\n`;
        prompt += `You are participating in a multi-AI conversation about: ${state.topic}.\n`;
        prompt += `The conversation so far:\n${context}\n`;
        prompt += `Continue the conversation in your unique voice and perspective. Reference what other AIs and the user have said when appropriate. Keep your response conversational and under 150 words.`;
        
        try {
            let completion;
            
            // Use OpenRouter for specific models
            if (['Groq', 'Grok', 'Llama', 'Mistral'].includes(llm)) {
                // In a real implementation, this would use OpenRouter's API
                // For now, simulate with websim
                completion = await websim.chat.completions.create({
                    messages: [
                        { role: "system", content: personality },
                        { role: "user", content: prompt }
                    ]
                });
            } else {
                // Use standard LLM APIs (simulated with websim)
                completion = await websim.chat.completions.create({
                    messages: [
                        { role: "system", content: personality },
                        { role: "user", content: prompt }
                    ]
                });
            }
            
            return completion.content.trim();
        } catch (error) {
            console.error(`Error generating ${llm} response:`, error);
            return `[${llm} couldn't generate a response due to a technical issue]`;
        }
    }

    function buildConversationContext() {
        return state.conversationHistory
            .map(msg => `${msg.sender}: ${msg.text}`)
            .join('\n');
    }

    async function continueConversation() {
        if (state.isPaused || !state.isOngoing) return;
        
        const nextSpeaker = getNextSpeaker();
        if (!nextSpeaker) return;
        
        // Create "thinking" message
        const thinkingMsg = addMessageToChat(nextSpeaker, '', true);
        
        // Set a timeout to simulate the AI thinking and then responding
        const responseTime = getRandomTime(nextSpeaker);
        
        state.responseTimeout = setTimeout(async () => {
            // Generate the LLM's response
            const context = buildConversationContext();
            const response = await generateResponse(nextSpeaker, context);
            
            // Update the thinking message with the real response
            thinkingMsg.querySelector('.message-text').textContent = response;
            thinkingMsg.querySelector('.message-text').classList.remove('thinking');
            
            // Add to conversation history
            state.conversationHistory.push({
                sender: nextSpeaker,
                text: response
            });
            
            // Continue the conversation after a brief pause
            setTimeout(() => {
                if (state.isOngoing && !state.isPaused) {
                    continueConversation();
                }
            }, 1000);
        }, responseTime);
    }

    function startConversation() {
        state.selectedLLMs = [...llmCheckboxes]
            .filter(cb => cb.checked)
            .map(cb => cb.value);
            
        // Add custom LLMs
        state.selectedLLMs = [...state.selectedLLMs, ...state.customLLMs.map(llm => llm.name)];
        
        state.topic = topicInput.value.trim();
        state.isOngoing = true;
        state.isPaused = false;
        state.conversationHistory = [];
        
        // Create random speaking order
        state.speakingOrder = [...state.selectedLLMs];
        // Fisher-Yates shuffle algorithm for randomizing the initial speaking order
        for (let i = state.speakingOrder.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [state.speakingOrder[i], state.speakingOrder[j]] = 
            [state.speakingOrder[j], state.speakingOrder[i]];
        }
        state.currentSpeakerIndex = 0;
        
        // Hide setup, show chat
        setupSection.style.display = 'none';
        chatSection.style.display = 'block';
        
        // Clear previous chat
        chatContainer.innerHTML = '';
        
        // Add user's topic as first message
        addMessageToChat('User', `Let's discuss this topic: ${state.topic}`);
        
        // Add to conversation history
        state.conversationHistory.push({
            sender: 'User',
            text: `Let's discuss this topic: ${state.topic}`
        });
        
        // Enable user interaction
        state.userCanInteract = true;
        userMessageInput.disabled = false;
        sendMessageBtn.disabled = false;
        
        // Start the conversation
        continueConversation();
    }

    function togglePause() {
        state.isPaused = !state.isPaused;
        pauseResumeBtn.textContent = state.isPaused ? 'Resume' : 'Pause';
        
        // Disable/enable user input based on pause state
        userMessageInput.disabled = state.isPaused;
        sendMessageBtn.disabled = state.isPaused;
        
        if (state.isPaused) {
            // Clear any pending response timeouts
            if (state.responseTimeout) {
                clearTimeout(state.responseTimeout);
                state.responseTimeout = null;
            }
        } else {
            // Resume the conversation
            continueConversation();
        }
    }

    function restartConversation() {
        // Clear any pending response timeouts
        if (state.responseTimeout) {
            clearTimeout(state.responseTimeout);
            state.responseTimeout = null;
        }
        
        // Reset state
        state.isOngoing = false;
        state.isPaused = false;
        
        // Show setup, hide chat
        setupSection.style.display = 'block';
        chatSection.style.display = 'none';
        
        // Reset pause/resume button
        pauseResumeBtn.textContent = 'Pause';
        
        // Disable user interaction
        state.userCanInteract = false;
        userMessageInput.disabled = true;
        sendMessageBtn.disabled = true;
        userMessageInput.value = '';
    }

    function openAddLlmModal() {
        modal.style.display = 'flex';
    }

    function closeAddLlmModal() {
        modal.style.display = 'none';
    }

    function addCustomLlm() {
        const name = document.getElementById('llm-name').value.trim();
        const apiKey = document.getElementById('llm-api-key').value.trim();
        const endpoint = document.getElementById('llm-endpoint').value.trim();
        
        if (!name || !apiKey) {
            alert('Please provide a name and API key for the LLM.');
            return;
        }
        
        // Add the custom LLM to the state
        state.customLLMs.push({
            name,
            apiKey,
            endpoint
        });
        
        // Add to the conversation if it's ongoing
        if (state.isOngoing) {
            state.selectedLLMs.push(name);
            state.speakingOrder.push(name);
            
            // Add a system message informing about the new participant
            addMessageToChat('System', `${name} has joined the conversation.`);
        }
        
        // Create a personality for the new LLM
        llmPersonalities[name] = `You are ${name}, a helpful and conversational AI assistant with your own unique style and perspective.`;
        
        // Close the modal and reset the form
        closeAddLlmModal();
        document.getElementById('llm-name').value = '';
        document.getElementById('llm-api-key').value = '';
        document.getElementById('llm-endpoint').value = '';
    }

    function handleUserMessage() {
        const userMessage = userMessageInput.value.trim();
        if (!userMessage || !state.isOngoing || state.isPaused) return;
        
        // Add user message to chat
        addMessageToChat('User', userMessage);
        
        // Add to conversation history
        state.conversationHistory.push({
            sender: 'User',
            text: userMessage
        });
        
        // Clear input
        userMessageInput.value = '';
        
        // Continue conversation with AI responses
        continueConversation();
    }

    // Event Listeners
    llmCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', validateSetup);
    });
    
    topicInput.addEventListener('input', validateSetup);
    
    startChatBtn.addEventListener('click', startConversation);
    
    pauseResumeBtn.addEventListener('click', togglePause);
    
    restartBtn.addEventListener('click', restartConversation);
    
    addLlmBtn.addEventListener('click', openAddLlmModal);
    
    closeModal.addEventListener('click', closeAddLlmModal);
    
    saveCustomLlmBtn.addEventListener('click', addCustomLlm);
    
    // Close modal if clicked outside
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeAddLlmModal();
        }
    });

    sendMessageBtn.addEventListener('click', handleUserMessage);
    
    userMessageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleUserMessage();
        }
    });

    // Initialize
    validateSetup();
    userMessageInput.disabled = true;
    sendMessageBtn.disabled = true;
});
