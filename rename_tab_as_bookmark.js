async function requestPermissionsIfNeeded() {
  let neededPermissions = {
    origins: ["<all_urls>"],
    permissions: ["tabs", "bookmarks", "scripting"],
  };

  if (!(await browser.permissions.contains(neededPermissions))) {
    await browser.permissions.request(neededPermissions);
  }
}

async function renameAllBookmarkedTabs() {
  try {
    let tabs = await browser.tabs.query({});
    tabs.forEach(async (tab) => {
      try {
        //to avoid matching unvalid urls
        if (!tab.url.startsWith("http")) {
          return;
        }

        //search a bookmark corresponding to tab url
        let foundBookmarks = await browser.bookmarks.search({
          url: tab.url,
        });

        //no bookmark found for tab url
        if (foundBookmarks.length === 0) {
          return;
        }

        //script that changes document title
        await browser.scripting.executeScript({
          target: {
            tabId: tab.id,
          },
          func: (tabTitle) => {
            document.title = tabTitle;
          },
          args: [foundBookmarks[0].title],
        });

        //TODO : currently not working for unknown reason
        //prevent current page to change document.title
        // await browser.scripting.executeScript({
        //   target: {
        //     tabId: tab.id,
        //   },
        //   func: () => {
        //     Object.defineProperty(document, "title", {
        //       set: function () {},
        //     });
        //   },
        });
      } catch (e) {
        console.log(`Error for the tab ${tab.title} (${tab.url})`, e);
        return;
      }
    });
  } catch (e) {
    console.log(e);
    return;
  }
}

//fire event at each new tab
browser.tabs.onUpdated.addListener(requestPermissionsIfNeeded);
browser.tabs.onUpdated.addListener(renameAllBookmarkedTabs);

//checks for bookmark changes (new bookmark, deletion, name change, url change)
browser.bookmarks.onCreated.addListener(renameAllBookmarkedTabs);
browser.bookmarks.onRemoved.addListener(renameAllBookmarkedTabs);
browser.bookmarks.onChanged.addListener(renameAllBookmarkedTabs);
