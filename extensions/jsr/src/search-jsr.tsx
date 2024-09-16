import { useEffect, useMemo, useState } from "react";

import { Action, List, Toast, showToast } from "@raycast/api";

import { packageToSearchResultDocument } from "@/lib/convert";

import useJSRAPIStats from "@/hooks/useJSRAPIStats";
import useJSRSearch from "@/hooks/useJSRSearch";

import ListItem from "@/components/ListItem";

import useJSRAPI from "./hooks/useJSRAPI";

export default function Command() {
  const [searchText, setSearchText] = useState("");
  const [isShowingDetails, setIsShowingDetails] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedPackage = useMemo(() => {
    if (!selectedId) {
      return null;
    }

    const [scope, name] = selectedId.split("/");
    return { scope, name };
  }, [selectedId]);

  const { data, isLoading, error } = useJSRSearch(searchText);
  const { data: statsData, isLoading: statsIsLoading } = useJSRAPIStats();
  const {
    data: selectedPackageData,
    error: selectedPackageError,
    isLoading: selectedPageLoading,
  } = useJSRAPI(selectedPackage);

  const extraActions = useMemo(() => {
    if (selectedPageLoading || selectedPackageError || !selectedPackageData) {
      return <></>;
    }
    if (selectedPackageData.githubRepository?.owner && selectedPackageData.githubRepository?.name) {
      return (
        <>
          <Action.OpenInBrowser
            title="Open GitHub Repository"
            icon={{ source: "github.svg" }}
            url={`https://github.com/${selectedPackageData.githubRepository.owner}/${selectedPackageData.githubRepository.name}`}
            shortcut={{ key: "g", modifiers: ["cmd", "shift"] }}
          />
        </>
      );
    }
    return <></>;
  }, [selectedPackageData, selectedPackageError, selectedPageLoading]);

  useEffect(() => {
    if (error) {
      console.error("Failed to fetch JSR search results", error);
      showToast({
        style: Toast.Style.Failure,
        title: "Error fetching JSR search results",
        message: error.message,
      });
    }
  }, [error]);

  return (
    <List
      filtering={false}
      isShowingDetail={isShowingDetails}
      throttle={true}
      onSearchTextChange={setSearchText}
      navigationTitle="Search JSR"
      searchBarPlaceholder="Search JSR packages"
      isLoading={isLoading || (searchText === "" && statsIsLoading)}
      onSelectionChange={setSelectedId}
    >
      {searchText === "" && statsData ? (
        <>
          <List.Section title="Featured">
            {statsData.featured.map((result) => (
              <ListItem
                key={`featured/${result.scope}/${result.name}`}
                item={packageToSearchResultDocument(result)}
                toggleDetails={() => {
                  setIsShowingDetails((state) => !state);
                }}
                isShowingDetails={isShowingDetails}
                extraActions={extraActions}
              />
            ))}
          </List.Section>
          <List.Section title="Newest">
            {statsData.newest.map((result) => (
              <ListItem
                key={`newest/${result.scope}/${result.name}`}
                item={packageToSearchResultDocument(result)}
                toggleDetails={() => {
                  setIsShowingDetails((state) => !state);
                }}
                isShowingDetails={isShowingDetails}
                extraActions={extraActions}
              />
            ))}
          </List.Section>
        </>
      ) : null}
      {data?.map((result) => (
        <ListItem
          key={result.id}
          item={result.document}
          toggleDetails={() => {
            setIsShowingDetails((state) => !state);
          }}
          isShowingDetails={isShowingDetails}
          extraActions={extraActions}
        />
      ))}
      <List.EmptyView
        title={searchText === "" ? "Search JSR Packages" : "No results found"}
        description={searchText !== "" ? "Try another search query" : ""}
        icon={{ source: "jsr.svg" }}
      />
    </List>
  );
}
