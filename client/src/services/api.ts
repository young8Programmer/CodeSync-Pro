import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

export interface CreateRoomResponse {
  success: boolean;
  data: {
    roomId: string;
    language: string;
    createdAt: string;
  };
}

export interface RoomDetails {
  success: boolean;
  data: {
    roomId: string;
    code: string;
    language: string;
    activeUsers: number;
    createdAt: string;
  };
}

export const api = {
  createRoom: async (language?: string, initialCode?: string): Promise<CreateRoomResponse> => {
    const response = await axios.post(`${API_URL}/rooms`, {
      language,
      initialCode,
    });
    return response.data;
  },

  getRoom: async (roomId: string): Promise<RoomDetails> => {
    const response = await axios.get(`${API_URL}/rooms/${roomId}`);
    return response.data;
  },
};
