import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addYoutubeLink,
  deleteMultimedia,
  fetchMultimediaByObservation,
  fetchMultimediaByPlayer,
  uploadMediaFile,
  MULTIMEDIA_TABLE_MISSING_CODE,
} from "../api/multimedia.api";

const QUERY_KEY_PLAYER = "multimedia-player";
const QUERY_KEY_OBSERVATION = "multimedia-observation";

export function useMultimediaByPlayer(playerId: string) {
  return useQuery({
    queryKey: [QUERY_KEY_PLAYER, playerId],
    queryFn: () => fetchMultimediaByPlayer(playerId),
    enabled: Boolean(playerId),
    retry: (_, error) =>
      (error as Error & { code?: string })?.code !== MULTIMEDIA_TABLE_MISSING_CODE,
  });
}

export function useMultimediaByObservation(observationId: string) {
  return useQuery({
    queryKey: [QUERY_KEY_OBSERVATION, observationId],
    queryFn: () => fetchMultimediaByObservation(observationId),
    enabled: Boolean(observationId),
    retry: (_, error) =>
      (error as Error & { code?: string })?.code !== MULTIMEDIA_TABLE_MISSING_CODE,
  });
}

export function useUploadMediaFile(playerId: string, observationId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { file: File; createdBy: string }) =>
      uploadMediaFile({
        file: params.file,
        playerId,
        observationId,
        createdBy: params.createdBy,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY_PLAYER, playerId] });
      if (observationId) {
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY_OBSERVATION, observationId] });
      }
    },
  });
}

export function useAddYoutubeLink(playerId: string, observationId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      youtubeUrl: string;
      videoId: string;
      createdBy: string;
      title?: string | null;
      thumbnailUrl?: string | null;
      durationSeconds?: number | null;
    }) =>
      addYoutubeLink({
        playerId,
        observationId,
        youtubeUrl: params.youtubeUrl,
        videoId: params.videoId,
        createdBy: params.createdBy,
        title: params.title,
        thumbnailUrl: params.thumbnailUrl,
        durationSeconds: params.durationSeconds,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY_PLAYER, playerId] });
      if (observationId) {
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY_OBSERVATION, observationId] });
      }
    },
  });
}

export function useDeleteMultimedia(playerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteMultimedia(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY_PLAYER, playerId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY_OBSERVATION] });
    },
  });
}
