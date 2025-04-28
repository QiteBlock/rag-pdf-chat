import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  VStack,
  Input,
  Button,
  Text,
  useToast,
  Flex,
  Avatar,
  Spinner,
} from "@chakra-ui/react";
import axios from "axios";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/ask_question/`,
        { user_question: input }
      );

      const assistantMessage: Message = {
        role: "assistant",
        content: response.data.answer,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get response. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      h="full"
      display="flex"
      flexDirection="column"
      bg="gray.50"
      borderRadius="lg"
      overflow="hidden"
    >
      <Box flex="1" overflowY="auto" p={4}>
        <VStack spacing={4} align="stretch">
          {messages.map((message, index) => (
            <Flex
              key={index}
              justify={message.role === "user" ? "flex-end" : "flex-start"}
            >
              <Box
                maxW="70%"
                bg={message.role === "user" ? "blue.500" : "white"}
                color={message.role === "user" ? "white" : "black"}
                p={3}
                borderRadius="lg"
                boxShadow="sm"
              >
                <Text>{message.content}</Text>
              </Box>
            </Flex>
          ))}
          {isLoading && (
            <Flex justify="flex-start">
              <Box bg="white" p={3} borderRadius="lg" boxShadow="sm">
                <Spinner size="sm" />
              </Box>
            </Flex>
          )}
          <div ref={messagesEndRef} />
        </VStack>
      </Box>

      <Box p={4} borderTop="1px" borderColor="gray.200" bg="white">
        <Flex>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question..."
            mr={2}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            colorScheme="blue"
            onClick={handleSend}
            isLoading={isLoading}
            isDisabled={!input.trim()}
          >
            Send
          </Button>
        </Flex>
      </Box>
    </Box>
  );
};

export default Chat;
