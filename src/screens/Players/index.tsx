import { useState, useEffect, useRef } from "react";
import { Alert, FlatList, TextInput } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";

import { AppError } from "@utils/AppError";

import { playerAddByGroup } from "@storage/player/playerAddByGroup";
import { playersGetByGroupAndTeam } from "@storage/player/playersGetByGroupAndTeam";
import { PlayerStorageDto } from "@storage/player/PlayerStorageDTO";
import { playerRemoveByGroup } from "@storage/player/playerRemoveByGroup";
import { groupRemoveByName } from "@storage/group/groupRemoveByName";

import { Input } from "@components/Input";
import { Filter } from "@components/Filter";
import { Header } from "@components/Header";
import { ButtonIcon } from "@components/ButtonIcon";
import { HighLight } from "@components/Highlight";
import { PlayerCard } from "@components/PlayerCard";
import { ListEmpty } from "@components/ListEmpty";
import { Button } from "@components/Button";
import { Loading } from "@components/Loading";

import { Container, Form, HeaderList, NumberOfPlayers } from "./styles";

type RouteParams = {
    group: string;
}

export function Players() {
    
    const [isLoading, setIsLoading] = useState(true);
    const [newPlayerName, setNewPlayerName] = useState('');
    const [team, setTeam] = useState('Time A');
    const [players, setPlayers] = useState<PlayerStorageDto[]>([]);

    const newPlayerNameInputRef = useRef<TextInput>(null);

    const navigation = useNavigation();
    const route = useRoute();

    const { group } = route.params as RouteParams;

    async function handleAddPlayer() {
        if (newPlayerName.trim().length === 0) {
            return Alert.alert('Nova pessoa', 'Informe o nome da pessoa para adicionar.');
        }

        const newPlayer = {
            name: newPlayerName,
            team,
        }

        try {
            await playerAddByGroup(newPlayer, group);

            newPlayerNameInputRef.current?.blur();

            setNewPlayerName('');
            fetchPlayersByTeam();

        } catch (error) {
            if (error instanceof AppError) {
                Alert.alert('Nova pessoa', error.message);
            } else {
                console.log(error);
                Alert.alert('Nova pessoa', 'N??o foi poss??vel adicionar.');
            }
        }
    }

    async function fetchPlayersByTeam() {
        try {
            setIsLoading(true);

            const playersByTeam = await playersGetByGroupAndTeam(group, team);
            setPlayers(playersByTeam);

        } catch (error) {
            console.log(error);
            Alert.alert('Pessoas', 'N??o foi poss??vel carregar as pessoas do time selecionado.');
        } finally {
            setIsLoading(false);
        }
    }

    async function handlePlayerRemove(playerName: string) {
        try {
            await playerRemoveByGroup(playerName, group);
            fetchPlayersByTeam();
        } catch (error) {
            console.log(error);
            Alert.alert('Remover pessoa', 'Nao foi possivel remover essa pessoa.');
        }
    }

    async function groupRemove() {
        try {
            await groupRemoveByName(group);
            navigation.navigate('groups');
        } catch (error) {
            console.log(error);
            Alert.alert('Remover grupo', 'Nao foi possivel remover o grupo.')
        }
    }

    async function handleGroupRemove() {
        Alert.alert(
            'Remover',
            'Deseja remover a turma?',
            [
                { text: 'Nao', style: 'cancel' },
                { text: 'Sim', onPress: () => groupRemove() },
            ]
        )
    }

    useEffect(() => {
        fetchPlayersByTeam();
    }, [team]);

    return (
        <Container>
            <Header showBackButton />

            <HighLight
                title={group}
                subtitle="adicione a galera e separe os times"
            />

            <Form>
                <Input
                    inputRef={newPlayerNameInputRef}
                    onChangeText={setNewPlayerName}
                    value={newPlayerName}
                    placeholder="Nome da pessoa"
                    autoCorrect={false}
                    onSubmitEditing={handleAddPlayer}
                    returnKeyType="done"
                />

                <ButtonIcon
                    icon="add"
                    onPress={handleAddPlayer}
                />
            </Form>

            <HeaderList>
                <FlatList
                    data={['Time A', 'Time B']}
                    keyExtractor={item => item}
                    renderItem={({ item }) => (
                        <Filter
                            title={item}
                            isActive={item === team}
                            onPress={() => setTeam(item)}
                        />
                    )}
                    horizontal
                />
                <NumberOfPlayers>
                    {players.length}
                </NumberOfPlayers>
            </HeaderList>

            {
                isLoading ? <Loading /> :

                    <FlatList
                        data={players}
                        keyExtractor={item => item.name}
                        renderItem={({ item }) => (
                            <PlayerCard
                                name={item.name}
                                onRemove={() => handlePlayerRemove(item.name)}
                            />
                        )}
                        ListEmptyComponent={() => (
                            <ListEmpty
                                message='Nao h?? pessoas nesse time.'
                            />
                        )}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={[{ paddingBottom: 100 }, players.length === 0 && { flex: 1 }]}
                    />
            }

            <Button
                title="Remover turma"
                type="SECONDARY"
                onPress={handleGroupRemove}
            />
        </Container>
    );
}